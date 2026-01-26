import { SupabaseClient } from '@supabase/supabase-js';
import type { Diary } from '../types';

// 日付で日記を取得
export async function getDiaryByDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

// 日記作成
export async function createDiary(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    date: string;
    content: string;
    summary?: string | null;
    emotion_tags?: string[] | null;
  }
): Promise<Diary> {
  const { data: diary, error } = await supabase
    .from('diaries')
    .insert({
      ...data,
      content_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return diary;
}

// 日記更新
export async function updateDiary(
  supabase: SupabaseClient,
  diaryId: string,
  updates: {
    content?: string;
    summary?: string | null;
    emotion_tags?: string[] | null;
    content_updated_at?: string;
  }
): Promise<Diary> {
  const { data, error } = await supabase
    .from('diaries')
    .update(updates)
    .eq('id', diaryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 日記削除
export async function deleteDiary(
  supabase: SupabaseClient,
  diaryId: string
): Promise<void> {
  const { error } = await supabase.from('diaries').delete().eq('id', diaryId);

  if (error) throw error;
}
