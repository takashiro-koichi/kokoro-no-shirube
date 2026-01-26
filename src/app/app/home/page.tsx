'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Moon, Star, Bell, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getUserProfile,
  getDiaryByDate,
  getDreamByDate,
  getWishlists,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Wishlist } from '@/lib/supabase/types';
import { emotionTagToEmoji } from '@/lib/utils/emotion';
import { formatDisplayDate, toDateString } from '@/lib/utils/date';

// 時間帯に応じた挨拶
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'おはようございます';
  if (hour < 18) return 'こんにちは';
  return 'こんばんは';
}

// 今週の日付を取得（日曜始まり）
function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOfWeek + i);
    dates.push(date);
  }

  return dates;
}

interface WeekRecord {
  date: string;
  hasDiary: boolean;
  hasDream: boolean;
  emotionEmoji: string | null;
}

export default function HomePage() {
  const { user } = useAuth();
  const [nickname, setNickname] = useState<string | null>(null);
  const [todayDiary, setTodayDiary] = useState<boolean>(false);
  const [todayDream, setTodayDream] = useState<boolean>(false);
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const today = toDateString(new Date());

      // ユーザープロフィール取得
      const profile = await getUserProfile(supabase, user.id);
      setNickname(profile?.nickname || null);

      // 今日の記録を確認
      const [diary, dream] = await Promise.all([
        getDiaryByDate(supabase, user.id, today),
        getDreamByDate(supabase, user.id, today),
      ]);
      setTodayDiary(diary !== null);
      setTodayDream(dream !== null);

      // 今週の記録を取得
      const weekDates = getWeekDates();
      const weekRecordsPromises = weekDates.map(async (date) => {
        const dateStr = toDateString(date);
        const [d, dr] = await Promise.all([
          getDiaryByDate(supabase, user.id, dateStr),
          getDreamByDate(supabase, user.id, dateStr),
        ]);
        return {
          date: dateStr,
          hasDiary: d !== null,
          hasDream: dr !== null,
          emotionEmoji: d ? emotionTagToEmoji(d.emotion_tags) : null,
        };
      });
      const records = await Promise.all(weekRecordsPromises);
      setWeekRecords(records);

      // ウィッシュリストを取得
      const wishlistData = await getWishlists(supabase, user.id);
      setWishlists(wishlistData);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ウィッシュリストのリマインド計算
  const today = new Date();
  const achievableWishes = wishlists.filter((w) => w.status === 'achievable');
  const upcomingDeadlines = wishlists
    .filter((w) => w.status !== 'achieved' && w.deadline)
    .map((w) => {
      const deadline = new Date(w.deadline!);
      const daysLeft = Math.ceil(
        (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...w, daysLeft };
    })
    .filter((w) => w.daysLeft > 0 && w.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const todayStr = toDateString(today);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 挨拶 */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold">
          {getGreeting()}
          {nickname && `、${nickname}さん`}
        </h1>
        <p className="text-muted-foreground mt-1">{formatDisplayDate(today)}</p>
      </div>

      {/* 今日の記録 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今日の記録</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* 日記 */}
            <Link href="/app/diary">
              <Card
                className={`hover:bg-accent/50 transition-colors cursor-pointer ${
                  todayDiary ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
                }`}
              >
                <CardContent className="p-4 text-center">
                  <BookOpen
                    className={`w-8 h-8 mx-auto mb-2 ${
                      todayDiary ? 'text-green-600' : 'text-blue-500'
                    }`}
                  />
                  <p className="font-medium">日記</p>
                  {todayDiary ? (
                    <Badge variant="secondary" className="mt-2">
                      記録済み
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2">
                      書く
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* 夢 */}
            <Link href="/app/dream">
              <Card
                className={`hover:bg-accent/50 transition-colors cursor-pointer ${
                  todayDream ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
                }`}
              >
                <CardContent className="p-4 text-center">
                  <Moon
                    className={`w-8 h-8 mx-auto mb-2 ${
                      todayDream ? 'text-green-600' : 'text-purple-500'
                    }`}
                  />
                  <p className="font-medium">夢記録</p>
                  {todayDream ? (
                    <Badge variant="secondary" className="mt-2">
                      記録済み
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2">
                      書く
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 今週の記録状況 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今週の記録状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* 曜日ヘッダー */}
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''
                }`}
              >
                {day}
              </div>
            ))}

            {/* 日付と記録状況 */}
            {weekRecords.map((record) => {
              const date = new Date(record.date);
              const isToday = record.date === todayStr;
              const isFuture = date > today;

              return (
                <div
                  key={record.date}
                  className={`
                    text-center py-2 rounded-md min-h-[60px] flex flex-col items-center justify-center
                    ${isToday ? 'bg-primary/10 border border-primary/30' : ''}
                    ${isFuture ? 'opacity-40' : ''}
                  `}
                >
                  <span className="text-xs text-muted-foreground">
                    {date.getDate()}
                  </span>
                  {!isFuture && (
                    <div className="flex gap-0.5 mt-1 text-sm">
                      {record.hasDiary && (
                        <span>{record.emotionEmoji || '●'}</span>
                      )}
                      {record.hasDream && <span>🌙</span>}
                      {!record.hasDiary && !record.hasDream && (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ウィッシュリストリマインド */}
      {(upcomingDeadlines.length > 0 || achievableWishes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              ウィッシュリスト
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 期限が近いもの */}
            {upcomingDeadlines.map((wish) => (
              <Link key={wish.id} href="/app/wishlist">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                  <Bell className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{wish.title}</p>
                    <p className="text-sm text-orange-600">
                      期限まであと{wish.daysLeft}日
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {/* 達成可能なもの */}
            {achievableWishes.slice(0, 3).map((wish) => (
              <Link key={wish.id} href="/app/wishlist">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{wish.title}</p>
                    <p className="text-sm text-green-600">達成可能！</p>
                  </div>
                </div>
              </Link>
            ))}

            {achievableWishes.length > 3 && (
              <Link href="/app/wishlist">
                <p className="text-sm text-muted-foreground text-center py-2 hover:underline">
                  他 {achievableWishes.length - 3} 件の達成可能なウィッシュ
                </p>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* ウィッシュリストが空の場合 */}
      {wishlists.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              ウィッシュリストを作成して、目標を管理しましょう
            </p>
            <Link href="/app/wishlist">
              <Button variant="outline">ウィッシュを追加</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
