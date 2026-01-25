import { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserProfile,
  UserSettings,
  VoiceFormatLevel,
  FortuneStyle,
  Diary,
} from './types';

// ユーザープロフィール取得
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない
      return null;
    }
    throw error;
  }

  return data;
}

// ユーザー設定取得
export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

// 初期登録（プロフィール + 設定を同時作成）
export async function createUserWithSettings(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    nickname?: string;
    birth_date: string;
  },
  settings: {
    voice_format_level?: VoiceFormatLevel;
    fortune_style?: FortuneStyle;
  }
): Promise<{ profile: UserProfile; settings: UserSettings }> {
  // プロフィール作成
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .insert({
      id: userId,
      nickname: profile.nickname || null,
      birth_date: profile.birth_date,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  // 設定作成
  const { data: settingsData, error: settingsError } = await supabase
    .from('user_settings')
    .insert({
      id: userId,
      voice_format_level: settings.voice_format_level || 'light',
      fortune_style: settings.fortune_style || 'jung',
    })
    .select()
    .single();

  if (settingsError) throw settingsError;

  return { profile: profileData, settings: settingsData };
}

// プロフィール更新
export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    nickname?: string | null;
    birth_date?: string;
  }
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 設定更新
export async function updateUserSettings(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    voice_format_level?: VoiceFormatLevel;
    fortune_style?: FortuneStyle;
  }
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ユーザーが初期登録済みかチェック
export async function checkUserOnboarded(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const profile = await getUserProfile(supabase, userId);
  return profile !== null;
}

// =====================================
// 日記関連
// =====================================

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
