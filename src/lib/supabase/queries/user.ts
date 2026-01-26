import { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserProfile,
  UserSettings,
  VoiceFormatLevel,
  FortuneStyle,
} from '../types';

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
// ユーザー属性関連
// =====================================

import type { UserAttribute } from '../types';

// ユーザー属性一覧取得
export async function getUserAttributes(
  supabase: SupabaseClient,
  userId: string
): Promise<UserAttribute[]> {
  const { data, error } = await supabase
    .from('user_attributes')
    .select('*')
    .eq('user_id', userId)
    .order('attribute_key');

  if (error) throw error;
  return data || [];
}

// ユーザー属性をマップ形式で取得
export async function getUserAttributesMap(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, UserAttribute>> {
  const attributes = await getUserAttributes(supabase, userId);
  return new Map(attributes.map((attr) => [attr.attribute_key, attr]));
}

// 属性の登録/更新（upsert）
export async function upsertUserAttribute(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    attribute_key: string;
    attribute_value?: number | null;
    text_value?: string | null;
    boolean_value?: boolean | null;
  }
): Promise<UserAttribute> {
  const { data: attribute, error } = await supabase
    .from('user_attributes')
    .upsert(data, {
      onConflict: 'user_id,attribute_key',
    })
    .select()
    .single();

  if (error) throw error;
  return attribute;
}

// 属性の削除
export async function deleteUserAttribute(
  supabase: SupabaseClient,
  userId: string,
  attributeKey: string
): Promise<void> {
  const { error } = await supabase
    .from('user_attributes')
    .delete()
    .eq('user_id', userId)
    .eq('attribute_key', attributeKey);

  if (error) throw error;
}
