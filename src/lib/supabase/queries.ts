import { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserProfile,
  UserSettings,
  VoiceFormatLevel,
  FortuneStyle,
  Diary,
  Dream,
  DreamKeyword,
  DreamWithKeywords,
  UserGlossary,
  ApiUsage,
  ApiLimitStatus,
  UserAttribute,
  Wishlist,
  TimelineItem,
  TimelineFilters,
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

// =====================================
// 夢記録関連
// =====================================

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

// =====================================
// 固有名詞関連
// =====================================

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

// =====================================
// API使用量関連
// =====================================

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

// =====================================
// ユーザー属性関連
// =====================================

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

// =====================================
// ウィッシュリスト関連
// =====================================

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

// =====================================
// 振り返り機能関連
// =====================================

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
