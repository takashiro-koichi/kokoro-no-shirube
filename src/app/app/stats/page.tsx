'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Heart, Cloud, Loader2, BookOpen, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyData {
  month: string;
  label: string;
  diary: number;
  dream: number;
}

interface EmotionData {
  tag: string;
  count: number;
}

interface KeywordData {
  keyword: string;
  count: number;
}

interface StatsData {
  monthlyData: MonthlyData[];
  emotionData: EmotionData[];
  keywordData: KeywordData[];
  totals: {
    diaries: number;
    dreams: number;
  };
}

// 感情タグの色マッピング
const emotionColors: Record<string, string> = {
  嬉しい: 'bg-yellow-400',
  楽しい: 'bg-orange-400',
  感謝: 'bg-pink-400',
  穏やか: 'bg-green-400',
  期待: 'bg-blue-400',
  悲しい: 'bg-indigo-400',
  不安: 'bg-purple-400',
  怒り: 'bg-red-400',
  疲れ: 'bg-gray-400',
  驚き: 'bg-cyan-400',
};

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Stats fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        データを読み込めませんでした
      </div>
    );
  }

  const maxMonthly = Math.max(
    ...data.monthlyData.map((d) => Math.max(d.diary, d.dream)),
    1
  );
  const maxEmotion = Math.max(...data.emotionData.map((d) => d.count), 1);
  const maxKeyword = Math.max(...data.keywordData.map((d) => d.count), 1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">統計</h1>
        <p className="text-muted-foreground mt-1">
          あなたの記録の傾向を確認できます
        </p>
      </div>

      {/* 総計 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{data.totals.diaries}</p>
            <p className="text-sm text-muted-foreground">日記の総数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Moon className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="text-3xl font-bold">{data.totals.dreams}</p>
            <p className="text-sm text-muted-foreground">夢記録の総数</p>
          </CardContent>
        </Card>
      </div>

      {/* 月ごとの記録数 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            月ごとの記録数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.monthlyData.map((month) => (
              <div key={month.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="w-12 text-muted-foreground">{month.label}</span>
                  <span className="text-xs text-muted-foreground">
                    日記: {month.diary} / 夢: {month.dream}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div
                    className="h-4 bg-blue-400 rounded transition-all duration-300"
                    style={{ width: `${(month.diary / maxMonthly) * 50}%` }}
                    title={`日記: ${month.diary}`}
                  />
                  <div
                    className="h-4 bg-purple-400 rounded transition-all duration-300"
                    style={{ width: `${(month.dream / maxMonthly) * 50}%` }}
                    title={`夢: ${month.dream}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span>日記</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded" />
              <span>夢記録</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 感情タグ分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5" />
            感情タグの分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.emotionData.length > 0 ? (
            <div className="space-y-2">
              {data.emotionData.map((emotion) => (
                <div key={emotion.tag} className="flex items-center gap-3">
                  <span className="w-16 text-sm truncate">{emotion.tag}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        emotionColors[emotion.tag] || 'bg-primary'
                      }`}
                      style={{ width: `${(emotion.count / maxEmotion) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-right text-muted-foreground">
                    {emotion.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              まだデータがありません
            </p>
          )}
        </CardContent>
      </Card>

      {/* 夢のキーワード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            よく見る夢のキーワード
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.keywordData.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.keywordData.map((item) => {
                // サイズを計算（1〜maxKeywordの範囲を0.75〜1.5remにマッピング）
                const size = 0.75 + (item.count / maxKeyword) * 0.75;
                const opacity = 0.5 + (item.count / maxKeyword) * 0.5;
                return (
                  <span
                    key={item.keyword}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full transition-transform hover:scale-105"
                    style={{
                      fontSize: `${size}rem`,
                      opacity,
                    }}
                    title={`${item.count}回`}
                  >
                    {item.keyword}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              まだデータがありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
