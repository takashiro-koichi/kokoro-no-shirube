import { SupabaseClient } from '@supabase/supabase-js';
import type { Dream, DreamKeyword, DreamWithKeywords, FortuneStyle } from '../types';

// 日付で夢記録を取得（キーワード含む）
export async function getDreamByDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DreamWithKeywords | null> {
  const { data, error } = await supabase
    .from('dreams')
    .select(
      `
      *,
      dream_keywords (*)
    `
    )
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return {
    ...data,
    keywords: data.dream_keywords || [],
  };
}

// 夢記録作成
export async function createDream(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    date: string;
    content: string;
  }
): Promise<Dream> {
  const { data: dream, error } = await supabase
    .from('dreams')
    .insert({
      ...data,
      content_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return dream;
}

// 夢記録更新
export async function updateDream(
  supabase: SupabaseClient,
  dreamId: string,
  updates: {
    content?: string;
    fortune_result?: string | null;
    fortune_style?: FortuneStyle | null;
    fortune_at?: string | null;
    content_updated_at?: string;
  }
): Promise<Dream> {
  const { data, error } = await supabase
    .from('dreams')
    .update(updates)
    .eq('id', dreamId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 夢記録削除
export async function deleteDream(
  supabase: SupabaseClient,
  dreamId: string
): Promise<void> {
  const { error } = await supabase.from('dreams').delete().eq('id', dreamId);

  if (error) throw error;
}

// =====================================
// 夢キーワード関連
// =====================================

// キーワード一括更新（既存を削除して新規追加）
export async function updateDreamKeywords(
  supabase: SupabaseClient,
  dreamId: string,
  keywords: string[]
): Promise<DreamKeyword[]> {
  // 既存キーワードを削除
  await supabase.from('dream_keywords').delete().eq('dream_id', dreamId);

  if (keywords.length === 0) {
    return [];
  }

  // 新規キーワードを追加
  const { data, error } = await supabase
    .from('dream_keywords')
    .insert(
      keywords.map((keyword) => ({
        dream_id: dreamId,
        keyword,
      }))
    )
    .select();

  if (error) throw error;
  return data;
}
