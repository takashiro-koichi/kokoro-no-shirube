import { SupabaseClient } from '@supabase/supabase-js';
import type { Wishlist, UserAttribute } from '../types';
import { getUserAttributesMap } from './user';

// ウィッシュリスト一覧取得
export async function getWishlists(
  supabase: SupabaseClient,
  userId: string
): Promise<Wishlist[]> {
  const { data, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ウィッシュリスト取得（単体）
export async function getWishlist(
  supabase: SupabaseClient,
  wishlistId: string
): Promise<Wishlist | null> {
  const { data, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('id', wishlistId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// ウィッシュリスト作成
export async function createWishlist(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    title: string;
    description?: string | null;
    condition1_attribute?: string | null;
    condition1_operator?: string | null;
    condition1_value?: number | null;
    condition2_attribute?: string | null;
    condition2_operator?: string | null;
    condition2_value?: number | null;
    deadline?: string | null;
  }
): Promise<Wishlist> {
  const { data: wishlist, error } = await supabase
    .from('wishlists')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return wishlist;
}

// ウィッシュリスト更新
export async function updateWishlist(
  supabase: SupabaseClient,
  wishlistId: string,
  updates: Partial<
    Omit<Wishlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >
): Promise<Wishlist> {
  const { data, error } = await supabase
    .from('wishlists')
    .update(updates)
    .eq('id', wishlistId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ウィッシュリスト削除
export async function deleteWishlist(
  supabase: SupabaseClient,
  wishlistId: string
): Promise<void> {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('id', wishlistId);

  if (error) throw error;
}

// ウィッシュリスト達成
export async function achieveWishlist(
  supabase: SupabaseClient,
  wishlistId: string
): Promise<Wishlist> {
  const { data, error } = await supabase
    .from('wishlists')
    .update({
      status: 'achieved',
      achieved_at: new Date().toISOString(),
    })
    .eq('id', wishlistId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ウィッシュリスト達成取り消し
export async function unachieveWishlist(
  supabase: SupabaseClient,
  wishlistId: string,
  newStatus: 'pending' | 'achievable' = 'pending'
): Promise<Wishlist> {
  const { data, error } = await supabase
    .from('wishlists')
    .update({
      status: newStatus,
      achieved_at: null,
    })
    .eq('id', wishlistId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================
// 条件評価ロジック
// =====================================

// 年齢を生年月日から計算
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// 条件を評価
export function evaluateCondition(
  attributeValue: number | null | undefined,
  operator: string,
  targetValue: number
): boolean {
  if (attributeValue === null || attributeValue === undefined) {
    return false;
  }

  switch (operator) {
    case 'gte':
      return attributeValue >= targetValue;
    case 'lte':
      return attributeValue <= targetValue;
    case 'eq':
      return attributeValue === targetValue;
    default:
      return false;
  }
}

// ウィッシュリストの達成可能性を評価
export function evaluateWishlistConditions(
  wishlist: Wishlist,
  attributesMap: Map<string, UserAttribute>,
  userAge?: number
): { condition1Met: boolean; condition2Met: boolean; isAchievable: boolean } {
  let condition1Met = false;
  let condition2Met = false;

  // 条件1の評価
  if (
    wishlist.condition1_attribute &&
    wishlist.condition1_operator &&
    wishlist.condition1_value !== null
  ) {
    let value: number | null = null;

    if (wishlist.condition1_attribute === 'age' && userAge !== undefined) {
      value = userAge;
    } else {
      const attr = attributesMap.get(wishlist.condition1_attribute);
      value = attr?.attribute_value ?? null;
    }

    condition1Met = evaluateCondition(
      value,
      wishlist.condition1_operator,
      wishlist.condition1_value
    );
  }

  // 条件2の評価
  if (
    wishlist.condition2_attribute &&
    wishlist.condition2_operator &&
    wishlist.condition2_value !== null
  ) {
    let value: number | null = null;

    if (wishlist.condition2_attribute === 'age' && userAge !== undefined) {
      value = userAge;
    } else {
      const attr = attributesMap.get(wishlist.condition2_attribute);
      value = attr?.attribute_value ?? null;
    }

    condition2Met = evaluateCondition(
      value,
      wishlist.condition2_operator,
      wishlist.condition2_value
    );
  }

  // OR結合: どちらかの条件を満たせばOK
  const hasCondition1 = wishlist.condition1_attribute !== null;
  const hasCondition2 = wishlist.condition2_attribute !== null;

  let isAchievable = false;
  if (!hasCondition1 && !hasCondition2) {
    // 条件なし = 常に達成可能
    isAchievable = true;
  } else if (hasCondition1 && hasCondition2) {
    // 両方の条件あり = OR結合
    isAchievable = condition1Met || condition2Met;
  } else if (hasCondition1) {
    isAchievable = condition1Met;
  } else {
    isAchievable = condition2Met;
  }

  return { condition1Met, condition2Met, isAchievable };
}

// ウィッシュリストのステータスを一括更新
export async function updateWishlistStatuses(
  supabase: SupabaseClient,
  userId: string,
  userBirthDate: string
): Promise<void> {
  const wishlists = await getWishlists(supabase, userId);
  const attributesMap = await getUserAttributesMap(supabase, userId);
  const userAge = calculateAge(userBirthDate);

  for (const wishlist of wishlists) {
    // 達成済みはスキップ
    if (wishlist.status === 'achieved') continue;

    const { isAchievable } = evaluateWishlistConditions(
      wishlist,
      attributesMap,
      userAge
    );
    const newStatus = isAchievable ? 'achievable' : 'pending';

    if (wishlist.status !== newStatus) {
      await updateWishlist(supabase, wishlist.id, { status: newStatus });
    }
  }
}
