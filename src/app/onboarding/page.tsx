'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createUserWithSettings } from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BackgroundCanvas } from '@/components/backgrounds';
import type { VoiceFormatLevel, FortuneStyle } from '@/lib/supabase/types';

const voiceFormatSamples: Record<VoiceFormatLevel, string> = {
  light:
    '今日は朝から天気がよくて気持ちよかった。会社で新しいプロジェクトの話があって、ちょっとわくわくした。帰りにカフェに寄った。',
  thorough:
    '今日は朝から天気がよく、気持ちのいい一日でした。会社では新しいプロジェクトの話があり、少しわくわくしました。帰りにはカフェに立ち寄り、リラックスした時間を過ごしました。',
  bullet:
    '• 朝から天気がよく気持ちよかった\n• 会社で新しいプロジェクトの話\n• 帰りにカフェへ',
};

const fortuneStyleSamples: Record<FortuneStyle, string> = {
  jung: '夢に登場するシンボルを人類共通の「集合的無意識」から読み解きます。たとえば水は感情、家は自己を表すと解釈し、あなたの内面の成長や変容のメッセージを探ります。',
  freud:
    '夢を無意識の願望の表れとして解釈します。日常で抑圧された欲求や感情が、形を変えて夢に現れると考え、あなたの本当の望みや心の奥底にある感情を探ります。',
  cognitive:
    '夢を脳が日中の経験や情報を整理するプロセスとして捉えます。スピリチュアルな解釈ではなく、現実的な視点から夢の内容を分析し、日々の課題や考え事との関連を探ります。',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nickname: '',
    birthDate: '1990-05-05',
    voiceFormatLevel: 'thorough' as VoiceFormatLevel,
    fortuneStyle: 'jung' as FortuneStyle,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('ログインが必要です');
      return;
    }

    if (!formData.birthDate) {
      setError('生年月日を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      await createUserWithSettings(
        supabase,
        user.id,
        {
          nickname: formData.nickname || undefined,
          birth_date: formData.birthDate,
        },
        {
          voice_format_level: formData.voiceFormatLevel,
          fortune_style: formData.fortuneStyle,
        }
      );
      router.push('/app/home');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <BackgroundCanvas />
      <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-primary">初期設定</h1>
            <p className="text-muted-foreground text-sm">
              こころのしるべをご利用いただきありがとうございます。
              <br />
              はじめにいくつかの設定を行います。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ニックネーム */}
            <div className="space-y-2">
              <Label htmlFor="nickname">ニックネーム（任意）</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="例: こころくん"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
              />
            </div>

            {/* 生年月日 */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">
                生年月日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                夢占いの精度向上のために使用されます。公開されることはありません。
              </p>
            </div>

            {/* 音声AI変換レベル */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>音声AI変換レベル</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <p className="font-medium text-sm">サンプル比較</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            軽め
                          </p>
                          <p className="text-xs">{voiceFormatSamples.light}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            しっかり
                          </p>
                          <p className="text-xs">
                            {voiceFormatSamples.thorough}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            箇条書き
                          </p>
                          <p className="text-xs whitespace-pre-line">
                            {voiceFormatSamples.bullet}
                          </p>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <RadioGroup
                value={formData.voiceFormatLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    voiceFormatLevel: value as VoiceFormatLevel,
                  })
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="format-light" />
                  <Label htmlFor="format-light" className="font-normal">
                    軽め - 最小限の整形のみ
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="thorough" id="format-thorough" />
                  <Label htmlFor="format-thorough" className="font-normal">
                    しっかり - 読みやすく整形（おすすめ）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bullet" id="format-bullet" />
                  <Label htmlFor="format-bullet" className="font-normal">
                    箇条書き - 要点を箇条書きに
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                後から設定画面で変更できます
              </p>
            </div>

            {/* 夢占いモード選択 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>夢占いモード選択</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <p className="font-medium text-sm">各モードの解説</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            ユング派
                          </p>
                          <p className="text-xs">{fortuneStyleSamples.jung}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            フロイト派
                          </p>
                          <p className="text-xs">{fortuneStyleSamples.freud}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            認知的アプローチ
                          </p>
                          <p className="text-xs">
                            {fortuneStyleSamples.cognitive}
                          </p>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <RadioGroup
                value={formData.fortuneStyle}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    fortuneStyle: value as FortuneStyle,
                  })
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="jung" id="style-jung" />
                  <Label htmlFor="style-jung" className="font-normal">
                    ユング派 - 象徴・集合的無意識（おすすめ）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="freud" id="style-freud" />
                  <Label htmlFor="style-freud" className="font-normal">
                    フロイト派 - 願望・抑圧
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cognitive" id="style-cognitive" />
                  <Label htmlFor="style-cognitive" className="font-normal">
                    認知的アプローチ - 日常の整理
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                後から設定画面で変更できます
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? '登録中...' : 'はじめる'}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
