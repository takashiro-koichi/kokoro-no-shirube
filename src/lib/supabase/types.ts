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
