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
