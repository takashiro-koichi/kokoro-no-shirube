import { SupabaseClient } from '@supabase/supabase-js';
import type { UserGlossary } from '../types';

// 固有名詞一覧取得
export async function getUserGlossary(
  supabase: SupabaseClient,
  userId: string
): Promise<UserGlossary[]> {
  const { data, error } = await supabase
    .from('user_glossary')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// 固有名詞追加
export async function createGlossaryItem(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    name: string;
    description: string;
  }
): Promise<UserGlossary> {
  const { data: item, error } = await supabase
    .from('user_glossary')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return item;
}

// 固有名詞更新
export async function updateGlossaryItem(
  supabase: SupabaseClient,
  itemId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<UserGlossary> {
  const { data, error } = await supabase
    .from('user_glossary')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 固有名詞削除
export async function deleteGlossaryItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_glossary')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
