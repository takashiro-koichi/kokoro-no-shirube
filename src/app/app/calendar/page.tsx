'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getMonthRecords,
  getDiaryByDate,
  getDreamByDate,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/reflection/Calendar';
import { DetailPanel } from '@/components/reflection/DetailPanel';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import type { CalendarDayData, TimelineItem } from '@/lib/supabase/types';
import { emotionTagToEmoji } from '@/lib/utils/emotion';

export default function CalendarPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 詳細パネル
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadMonthData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const records = await getMonthRecords(supabase, user.id, year, month);

      // CalendarDayDataに変換
      const dataMap = new Map<string, CalendarDayData>();

      // 日記データ
      for (const diary of records.diaries) {
        const existing = dataMap.get(diary.date) || {
          date: diary.date,
          hasDiary: false,
          hasDream: false,
          hasAchievement: false,
          emotionEmoji: null,
          diarySummary: null,
        };

        existing.hasDiary = true;
        existing.emotionEmoji = emotionTagToEmoji(diary.emotion_tags);
        existing.diarySummary = diary.summary;

        dataMap.set(diary.date, existing);
      }

      // 夢データ
      for (const dream of records.dreams) {
        const existing = dataMap.get(dream.date) || {
          date: dream.date,
          hasDiary: false,
          hasDream: false,
          hasAchievement: false,
          emotionEmoji: null,
          diarySummary: null,
        };

        existing.hasDream = true;
        existing.dreamKeywords = dream.keywords;

        dataMap.set(dream.date, existing);
      }

      // ウィッシュリスト達成データ
      for (const wishlist of records.wishlists) {
        const dateStr = wishlist.achieved_at.split('T')[0];
        const existing = dataMap.get(dateStr) || {
          date: dateStr,
          hasDiary: false,
          hasDream: false,
          hasAchievement: false,
          emotionEmoji: null,
          diarySummary: null,
        };

        existing.hasAchievement = true;

        dataMap.set(dateStr, existing);
      }

      setCalendarData(Array.from(dataMap.values()));
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('カレンダーデータの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  // 日付クリック時の処理
  const handleDayClick = async (date: string) => {
    if (!user) return;

    setIsLoadingDetail(true);
    setIsPanelOpen(true);

    try {
      const supabase = createClient();

      // 日記を取得
      const diary = await getDiaryByDate(supabase, user.id, date);
      if (diary) {
        setSelectedItem({
          id: diary.id,
          type: 'diary',
          date: diary.date,
          content: diary.content,
          summary: diary.summary,
          emotion_tags: diary.emotion_tags,
          created_at: diary.created_at,
        });
        setIsLoadingDetail(false);
        return;
      }

      // 夢記録を取得
      const dream = await getDreamByDate(supabase, user.id, date);
      if (dream) {
        setSelectedItem({
          id: dream.id,
          type: 'dream',
          date: dream.date,
          content: dream.content,
          summary: null,
          emotion_tags: null,
          dream_keywords: dream.keywords.map((k) => k.keyword),
          fortune_result: dream.fortune_result,
          created_at: dream.created_at,
        });
        setIsLoadingDetail(false);
        return;
      }

      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to load detail:', err);
      setSelectedItem(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 月変更時の処理
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  // 前月へ移動
  const goToPreviousMonth = useCallback(() => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }, [year, month]);

  // 次月へ移動
  const goToNextMonth = useCallback(() => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }, [year, month]);

  // スワイプナビゲーション
  const swipeRef = useSwipeNavigation<HTMLDivElement>({
    onSwipeLeft: goToNextMonth,
    onSwipeRight: goToPreviousMonth,
    enabled: !isLoading && !isLoadingDetail,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div ref={swipeRef} className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">カレンダー</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Calendar
        year={year}
        month={month}
        data={calendarData}
        onDayClick={handleDayClick}
        onMonthChange={handleMonthChange}
      />

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>😊</span>
          <span>日記（感情あり）</span>
        </div>
        <div className="flex items-center gap-1">
          <span>●</span>
          <span>日記(感情記録なし)</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🌙</span>
          <span>夢記録</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🎉</span>
          <span>ウィッシュ達成</span>
        </div>
      </div>

      {/* 詳細パネル */}
      <DetailPanel
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        item={isLoadingDetail ? null : selectedItem}
      />

      {/* ローディング表示 */}
      {isLoadingDetail && isPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
