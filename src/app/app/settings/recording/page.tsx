'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserSettings, updateUserSettings } from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserSettings, VoiceFormatLevel } from '@/lib/supabase/types';

const formatLevelOptions: {
  value: VoiceFormatLevel;
  label: string;
  description: string;
  sample: string;
}[] = [
  {
    value: 'light',
    label: '軽め',
    description: '最小限の整形のみ行います',
    sample:
      '今日は朝から天気がよくて気持ちよかった。会社で新しいプロジェクトの話があって、ちょっとわくわくした。帰りにカフェに寄った。',
  },
  {
    value: 'thorough',
    label: 'しっかり（おすすめ）',
    description: '文章を読みやすく整えます',
    sample:
      '今日は朝から天気がよく、気持ちのいい一日でした。会社では新しいプロジェクトの話があり、少しわくわくしました。帰りにはカフェに立ち寄り、リラックスした時間を過ごしました。',
  },
  {
    value: 'bullet',
    label: '箇条書き',
    description: '要点を箇条書きにまとめます',
    sample: '• 朝から天気がよく気持ちよかった\n• 会社で新しいプロジェクトの話\n• 帰りにカフェへ',
  },
];

export default function RecordingSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [voiceFormatLevel, setVoiceFormatLevel] =
    useState<VoiceFormatLevel>('light');

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const data = await getUserSettings(supabase, user.id);
        if (data) {
          setSettings(data);
          setVoiceFormatLevel(data.voice_format_level);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('設定の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user || !settings) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      await updateUserSettings(supabase, user.id, {
        voice_format_level: voiceFormatLevel,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedOption = formatLevelOptions.find(
    (opt) => opt.value === voiceFormatLevel
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">記録設定</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label>音声AI変換レベル</Label>
          <RadioGroup
            value={voiceFormatLevel}
            onValueChange={(value) =>
              setVoiceFormatLevel(value as VoiceFormatLevel)
            }
            className="space-y-2"
          >
            {formatLevelOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`format-${option.value}`}
                  className="mt-1"
                />
                <div>
                  <Label
                    htmlFor={`format-${option.value}`}
                    className="font-medium"
                  >
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {selectedOption && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">サンプル</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">
                {selectedOption.sample}
              </p>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {success && <p className="text-green-600 text-sm">保存しました</p>}

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}
