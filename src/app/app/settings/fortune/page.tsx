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
import type { UserSettings, FortuneStyle } from '@/lib/supabase/types';

const fortuneStyleOptions: {
  value: FortuneStyle;
  label: string;
  description: string;
  approach: string;
}[] = [
  {
    value: 'jung',
    label: 'ユング派（おすすめ）',
    description: '象徴・集合的無意識に基づく解釈',
    approach:
      '夢に登場するシンボルを人類共通の「集合的無意識」から読み解きます。たとえば水は感情、家は自己を表すと解釈し、あなたの内面の成長や変容のメッセージを探ります。',
  },
  {
    value: 'freud',
    label: 'フロイト派',
    description: '願望・抑圧に基づく解釈',
    approach:
      '夢を無意識の願望の表れとして解釈します。日常で抑圧された欲求や感情が、形を変えて夢に現れると考え、あなたの本当の望みや心の奥底にある感情を探ります。',
  },
  {
    value: 'cognitive',
    label: '認知的アプローチ',
    description: '日常の整理・問題解決に焦点',
    approach:
      '夢を脳が日中の経験や情報を整理するプロセスとして捉えます。スピリチュアルな解釈ではなく、現実的な視点から夢の内容を分析し、日々の課題や考え事との関連を探ります。',
  },
];

export default function FortuneSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fortuneStyle, setFortuneStyle] = useState<FortuneStyle>('jung');

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const data = await getUserSettings(supabase, user.id);
        if (data) {
          setSettings(data);
          setFortuneStyle(data.fortune_style);
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
        fortune_style: fortuneStyle,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedOption = fortuneStyleOptions.find(
    (opt) => opt.value === fortuneStyle
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
        <h1 className="text-2xl font-bold">夢占い設定</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label>夢占いモード選択</Label>
          <RadioGroup
            value={fortuneStyle}
            onValueChange={(value) => setFortuneStyle(value as FortuneStyle)}
            className="space-y-2"
          >
            {fortuneStyleOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`style-${option.value}`}
                  className="mt-1"
                />
                <div>
                  <Label
                    htmlFor={`style-${option.value}`}
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
              <CardTitle className="text-sm">このスタイルについて</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{selectedOption.approach}</p>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {success && <p className="text-green-600 text-sm">保存しました</p>}

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}
