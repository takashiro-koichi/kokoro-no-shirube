import { SupabaseClient } from '@supabase/supabase-js';
import type { TimelineItem, TimelineFilters } from '../types';

// カレンダー表示用: 月のデータを一括取得
export async function getMonthRecords(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<{
  diaries: Array<{ date: string; summary: string | null; emotion_tags: string[] | null }>;
  dreams: Array<{ date: string; keywords: string[] }>;
  wishlists: Array<{ achieved_at: string }>;
}> {
  // 月の開始日と終了日
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // 日記を取得
  const { data: diaries, error: diaryError } = await supabase
    .from('diaries')
    .select('date, summary, emotion_tags')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (diaryError) throw diaryError;

  // 夢記録を取得（キーワード含む）
  const { data: dreams, error: dreamError } = await supabase
    .from('dreams')
    .select(`
      date,
      dream_keywords (keyword)
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (dreamError) throw dreamError;

  // ウィッシュリスト達成を取得
  const achievedStart = `${startDate}T00:00:00`;
  const achievedEnd = `${endDate}T23:59:59`;
  const { data: wishlists, error: wishlistError } = await supabase
    .from('wishlists')
    .select('achieved_at')
    .eq('user_id', userId)
    .eq('status', 'achieved')
    .gte('achieved_at', achievedStart)
    .lte('achieved_at', achievedEnd);

  if (wishlistError) throw wishlistError;

  return {
    diaries: diaries || [],
    dreams: (dreams || []).map((d) => ({
      date: d.date,
      keywords: (d.dream_keywords as { keyword: string }[] || []).map((k) => k.keyword),
    })),
    wishlists: wishlists || [],
  };
}

// タイムライン用: ページネーション付き日記・夢取得
export async function getTimelineRecords(
  supabase: SupabaseClient,
  userId: string,
  options: {
    limit: number;
    cursor?: string;
    filters?: Partial<TimelineFilters>;
  }
): Promise<{ items: TimelineItem[]; nextCursor: string | null }> {
  const { limit, cursor, filters } = options;
  const items: TimelineItem[] = [];

  const shouldFetchDiaries = !filters?.type || filters.type === 'diary' || filters.type === 'both';
  const shouldFetchDreams = !filters?.type || filters.type === 'dream' || filters.type === 'both';

  // 日記を取得
  if (shouldFetchDiaries) {
    let diaryQuery = supabase
      .from('diaries')
      .select('id, date, content, summary, emotion_tags, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // カーソル（created_at）で絞り込み
    if (cursor) {
      diaryQuery = diaryQuery.lt('created_at', cursor);
    }

    // フィルタ適用
    if (filters?.dateFrom) {
      diaryQuery = diaryQuery.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      diaryQuery = diaryQuery.lte('date', filters.dateTo);
    }
    if (filters?.keyword) {
      diaryQuery = diaryQuery.or(
        `content.ilike.%${filters.keyword}%,summary.ilike.%${filters.keyword}%`
      );
    }
    if (filters?.emotionTags && filters.emotionTags.length > 0) {
      // いずれかのタグを含む
      diaryQuery = diaryQuery.overlaps('emotion_tags', filters.emotionTags);
    }

    const { data: diaries, error: diaryError } = await diaryQuery;
    if (diaryError) throw diaryError;

    for (const diary of diaries || []) {
      items.push({
        id: diary.id,
        type: 'diary',
        date: diary.date,
        content: diary.content,
        summary: diary.summary,
        emotion_tags: diary.emotion_tags,
        created_at: diary.created_at,
      });
    }
  }

  // 夢記録を取得
  if (shouldFetchDreams) {
    let dreamQuery = supabase
      .from('dreams')
      .select(`
        id, date, content, fortune_result, created_at,
        dream_keywords (keyword)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      dreamQuery = dreamQuery.lt('created_at', cursor);
    }

    if (filters?.dateFrom) {
      dreamQuery = dreamQuery.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      dreamQuery = dreamQuery.lte('date', filters.dateTo);
    }
    if (filters?.keyword) {
      dreamQuery = dreamQuery.ilike('content', `%${filters.keyword}%`);
    }

    const { data: dreams, error: dreamError } = await dreamQuery;
    if (dreamError) throw dreamError;

    for (const dream of dreams || []) {
      const keywords = (dream.dream_keywords as { keyword: string }[] || []).map((k) => k.keyword);

      // 夢キーワードフィルタ
      if (filters?.dreamKeywords && filters.dreamKeywords.length > 0) {
        const hasMatchingKeyword = filters.dreamKeywords.some((fk) =>
          keywords.includes(fk)
        );
        if (!hasMatchingKeyword) continue;
      }

      items.push({
        id: dream.id,
        type: 'dream',
        date: dream.date,
        content: dream.content,
        summary: null,
        emotion_tags: null,
        dream_keywords: keywords,
        fortune_result: dream.fortune_result,
        created_at: dream.created_at,
      });
    }
  }

  // 日付とcreated_atで並び替え
  items.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.created_at.localeCompare(a.created_at);
  });

  // limitで切り取り
  const sliced = items.slice(0, limit);
  const nextCursor = sliced.length === limit ? sliced[sliced.length - 1].created_at : null;

  return { items: sliced, nextCursor };
}

// 全ての感情タグを取得（フィルタ用）
export async function getAllEmotionTags(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('emotion_tags')
    .eq('user_id', userId)
    .not('emotion_tags', 'is', null);

  if (error) throw error;

  const tagSet = new Set<string>();
  for (const diary of data || []) {
    if (diary.emotion_tags) {
      for (const tag of diary.emotion_tags) {
        tagSet.add(tag);
      }
    }
  }

  return Array.from(tagSet).sort();
}

// 全ての夢キーワードを取得（フィルタ用）
export async function getAllDreamKeywords(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('dream_keywords')
    .select('keyword, dreams!inner(user_id)')
    .eq('dreams.user_id', userId);

  if (error) throw error;

  const keywordSet = new Set<string>();
  for (const item of data || []) {
    keywordSet.add(item.keyword);
  }

  return Array.from(keywordSet).sort();
}

// 記録のある年月一覧を取得（ナビゲーター用）
export async function getAvailableMonths(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ year: number; month: number }>> {
  // 日記の年月
  const { data: diaryMonths, error: diaryError } = await supabase
    .from('diaries')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (diaryError) throw diaryError;

  // 夢記録の年月
  const { data: dreamMonths, error: dreamError } = await supabase
    .from('dreams')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (dreamError) throw dreamError;

  const monthSet = new Set<string>();

  for (const d of diaryMonths || []) {
    const [year, month] = d.date.split('-');
    monthSet.add(`${year}-${month}`);
  }

  for (const d of dreamMonths || []) {
    const [year, month] = d.date.split('-');
    monthSet.add(`${year}-${month}`);
  }

  const months = Array.from(monthSet)
    .sort((a, b) => b.localeCompare(a))
    .map((ym) => {
      const [year, month] = ym.split('-');
      return { year: parseInt(year, 10), month: parseInt(month, 10) };
    });

  return months;
}
