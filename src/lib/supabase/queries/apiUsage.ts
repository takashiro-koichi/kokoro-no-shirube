import { SupabaseClient } from '@supabase/supabase-js';
import type { ApiUsage, ApiLimitStatus } from '../types';

const DAILY_FORTUNE_LIMIT = 20;

// 本日のAPI使用量を取得
export async function getApiUsageToday(
  supabase: SupabaseClient,
  userId: string
): Promise<ApiUsage | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

// API使用回数をインクリメント
export async function incrementFortuneUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<ApiUsage> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase.rpc('increment_dream_fortune_count', {
    p_user_id: userId,
    p_date: today,
  });

  if (error) throw error;
  return data;
}

// API制限チェック
export async function checkFortuneLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<ApiLimitStatus> {
  const usage = await getApiUsageToday(supabase, userId);
  const currentCount = usage?.dream_fortune_count || 0;

  return {
    canUse: currentCount < DAILY_FORTUNE_LIMIT,
    currentCount,
    limit: DAILY_FORTUNE_LIMIT,
    remainingCount: Math.max(0, DAILY_FORTUNE_LIMIT - currentCount),
  };
}
