import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 過去12ヶ月の日記・夢記録を取得
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    const startDate = twelveMonthsAgo.toISOString().split('T')[0];

    // 日記を取得
    const { data: diaries } = await supabase
      .from('diaries')
      .select('date, emotion_tags')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true });

    // 夢記録を取得
    const { data: dreams } = await supabase
      .from('dreams')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true });

    // 夢キーワードを取得
    const { data: dreamKeywords } = await supabase
      .from('dream_keywords')
      .select('keyword')
      .eq('user_id', user.id);

    // 月ごとの記録数を集計
    const monthlyStats: Record<string, { diary: number; dream: number }> = {};

    // 過去12ヶ月分の月を初期化
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[key] = { diary: 0, dream: 0 };
    }

    // 日記をカウント
    for (const diary of diaries || []) {
      const month = diary.date.substring(0, 7);
      if (monthlyStats[month]) {
        monthlyStats[month].diary++;
      }
    }

    // 夢をカウント
    for (const dream of dreams || []) {
      const month = dream.date.substring(0, 7);
      if (monthlyStats[month]) {
        monthlyStats[month].dream++;
      }
    }

    // 月ごとのデータを配列に変換（古い順）
    const monthlyData = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({
        month,
        label: `${parseInt(month.split('-')[1])}月`,
        ...counts,
      }));

    // 感情タグの集計
    const emotionCounts: Record<string, number> = {};
    for (const diary of diaries || []) {
      for (const tag of diary.emotion_tags || []) {
        emotionCounts[tag] = (emotionCounts[tag] || 0) + 1;
      }
    }

    // 感情タグをソート（多い順）
    const emotionData = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // 夢キーワードの集計
    const keywordCounts: Record<string, number> = {};
    for (const item of dreamKeywords || []) {
      keywordCounts[item.keyword] = (keywordCounts[item.keyword] || 0) + 1;
    }

    // キーワードをソート（多い順）
    const keywordData = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    // 総計
    const totalDiaries = diaries?.length || 0;
    const totalDreams = dreams?.length || 0;

    return NextResponse.json({
      monthlyData,
      emotionData,
      keywordData,
      totals: {
        diaries: totalDiaries,
        dreams: totalDreams,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
