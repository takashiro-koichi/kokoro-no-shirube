export type VoiceFormatLevel = 'light' | 'thorough' | 'bullet';
export type FortuneStyle = 'jung' | 'freud' | 'cognitive';

export interface UserProfile {
  id: string;
  nickname: string | null;
  birth_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  voice_format_level: VoiceFormatLevel;
  fortune_style: FortuneStyle;
  created_at: string;
  updated_at: string;
}

export interface UserWithSettings extends UserProfile {
  settings: UserSettings | null;
}

export interface Diary {
  id: string;
  user_id: string;
  date: string;
  content: string;
  summary: string | null;
  emotion_tags: string[] | null;
  content_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

// 夢記録
export interface Dream {
  id: string;
  user_id: string;
  date: string;
  content: string;
  fortune_result: string | null;
  fortune_style: FortuneStyle | null;
  fortune_at: string | null;
  content_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

// 夢キーワード
export interface DreamKeyword {
  id: string;
  dream_id: string;
  keyword: string;
  created_at: string;
}

// 夢記録とキーワードの結合型
export interface DreamWithKeywords extends Dream {
  keywords: DreamKeyword[];
}

// 固有名詞
export interface UserGlossary {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// API使用量
export interface ApiUsage {
  id: string;
  user_id: string;
  usage_date: string;
  dream_fortune_count: number;
  created_at: string;
  updated_at: string;
}

// API制限チェック結果
export interface ApiLimitStatus {
  canUse: boolean;
  currentCount: number;
  limit: number;
  remainingCount: number;
}

// =====================================
// ウィッシュリスト関連
// =====================================

// 属性キー
export type AttributeKey =
  // 金銭・資産系
  | 'annual_income'
  | 'savings'
  | 'investment_assets'
  | 'monthly_disposable'
  | 'debt_balance'
  // 時間・ライフステージ系
  | 'age'
  | 'child_age'
  | 'years_employed'
  | 'paid_leave_remaining'
  | 'retired'
  // 健康・自己投資系
  | 'weight'
  | 'certification'
  // 人間関係・状況系
  | 'has_partner'
  | 'residence'
  | 'job_title';

// 比較演算子
export type ComparisonOperator = 'gte' | 'lte' | 'eq';

// ユーザー属性
export interface UserAttribute {
  id: string;
  user_id: string;
  attribute_key: string;
  attribute_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  created_at: string;
  updated_at: string;
}

// ウィッシュリストのステータス
export type WishlistStatus = 'pending' | 'achievable' | 'achieved';

// ウィッシュリスト
export interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  condition1_attribute: string | null;
  condition1_operator: string | null;
  condition1_value: number | null;
  condition2_attribute: string | null;
  condition2_operator: string | null;
  condition2_value: number | null;
  deadline: string | null;
  status: WishlistStatus;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ウィッシュリスト（条件評価結果付き）
export interface WishlistWithEvaluation extends Wishlist {
  condition1_met?: boolean;
  condition2_met?: boolean;
}
