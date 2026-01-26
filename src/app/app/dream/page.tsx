'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Wand2,
  Loader2,
  Undo2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getDreamByDate,
  createDream,
  updateDream,
  deleteDream,
  updateDreamKeywords,
  getUserSettings,
  getUserGlossary,
  checkFortuneLimit,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceInput } from '@/components/common/VoiceInput';
import { DatePicker, parseLocalDate } from '@/components/common/DatePicker';
import type {
  DreamWithKeywords,
  VoiceFormatLevel,
  FortuneStyle,
  UserGlossary,
} from '@/lib/supabase/types';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
}

const FORTUNE_STYLE_LABELS: Record<FortuneStyle, string> = {
  jung: 'ユング派',
  freud: 'フロイト派',
  cognitive: '認知的アプローチ',
};

export default function DreamPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [content, setContent] = useState('');
  const [dream, setDream] = useState<DreamWithKeywords | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [voiceFormatLevel, setVoiceFormatLevel] =
    useState<VoiceFormatLevel>('thorough');
  const [fortuneStyle, setFortuneStyle] = useState<FortuneStyle>('jung');
  const [glossary, setGlossary] = useState<UserGlossary[]>([]);
  const [remainingCount, setRemainingCount] = useState<number>(20);

  // 音声入力用
  const [voiceText, setVoiceText] = useState('');

  // 履歴（元に戻す用）
  const [contentHistory, setContentHistory] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isFormattingVoice, setIsFormattingVoice] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [isFortuneTelling, setIsFortuneTelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 夢記録と設定を読み込む
  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 設定を取得
      const settings = await getUserSettings(supabase, user.id);
      if (settings) {
        setVoiceFormatLevel(settings.voice_format_level);
        setFortuneStyle(settings.fortune_style);
      }

      // 固有名詞を取得
      const glossaryData = await getUserGlossary(supabase, user.id);
      setGlossary(glossaryData);

      // API制限を取得
      const limitStatus = await checkFortuneLimit(supabase, user.id);
      setRemainingCount(limitStatus.remainingCount);

      // 夢記録を取得
      const dreamData = await getDreamByDate(supabase, user.id, selectedDate);
      setDream(dreamData);
      setContent(dreamData?.content || '');
      setKeywords(dreamData?.keywords.map((k) => k.keyword) || []);
      setVoiceText('');
      setContentHistory([]);
    } catch (err) {
      console.error('Failed to load dream:', err);
      setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 日付変更
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(formatDate(date));
    setSuccess(null);
  };

  // 音声入力のトランスクリプト追加
  const handleTranscript = (text: string) => {
    setVoiceText((prev) => prev + text);
  };

  // 履歴に保存してからコンテンツを更新
  const updateContentWithHistory = (newContent: string) => {
    setContentHistory((prev) => [...prev, content]);
    setContent(newContent);
  };

  // 元に戻す
  const handleUndo = () => {
    if (contentHistory.length === 0) return;
    const previousContent = contentHistory[contentHistory.length - 1];
    setContentHistory((prev) => prev.slice(0, -1));
    setContent(previousContent);
  };

  // 全文整形
  const handleFormatAll = async () => {
    if (!content.trim()) return;

    setIsFormatting(true);
    setError(null);

    try {
      const response = await fetch('/api/diary/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, level: voiceFormatLevel }),
      });

      if (!response.ok) {
        throw new Error('整形に失敗しました');
      }

      const data = await response.json();
      updateContentWithHistory(data.formatted);
    } catch (err) {
      console.error('Format error:', err);
      setError('整形に失敗しました');
    } finally {
      setIsFormatting(false);
    }
  };

  // 整形して追記
  const handleFormatAndAdd = async () => {
    if (!voiceText.trim()) return;

    setIsFormattingVoice(true);
    setError(null);

    try {
      const response = await fetch('/api/diary/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceText, level: voiceFormatLevel }),
      });

      if (!response.ok) {
        throw new Error('整形に失敗しました');
      }

      const data = await response.json();
      const newContent = content
        ? content + '\n\n' + data.formatted
        : data.formatted;
      updateContentWithHistory(newContent);
      setVoiceText('');
    } catch (err) {
      console.error('Format error:', err);
      setError('整形に失敗しました');
    } finally {
      setIsFormattingVoice(false);
    }
  };

  // そのまま追記
  const handleAddWithoutFormat = () => {
    if (!voiceText.trim()) return;
    const newContent = content ? content + '\n\n' + voiceText : voiceText;
    updateContentWithHistory(newContent);
    setVoiceText('');
  };

  // キーワード抽出
  const handleExtractKeywords = async () => {
    if (!content.trim()) return;

    setIsExtractingKeywords(true);
    setError(null);

    try {
      const response = await fetch('/api/dream/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('キーワード抽出に失敗しました');
      }

      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      console.error('Keywords error:', err);
      setError('キーワード抽出に失敗しました');
    } finally {
      setIsExtractingKeywords(false);
    }
  };

  // キーワード削除
  const removeKeyword = (index: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== index));
  };

  // 保存
  const handleSave = async () => {
    if (!user || !content.trim()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      let savedDream: DreamWithKeywords;

      if (dream) {
        // 更新
        const updated = await updateDream(supabase, dream.id, {
          content,
          content_updated_at: new Date().toISOString(),
        });
        savedDream = { ...updated, keywords: dream.keywords };
      } else {
        // 新規作成
        const created = await createDream(supabase, {
          user_id: user.id,
          date: selectedDate,
          content,
        });
        savedDream = { ...created, keywords: [] };
      }

      // キーワードを保存
      if (keywords.length > 0) {
        const savedKeywords = await updateDreamKeywords(
          supabase,
          savedDream.id,
          keywords
        );
        savedDream.keywords = savedKeywords;
      }

      setDream(savedDream);
      setSuccess('保存しました');
      setContentHistory([]);
    } catch (err) {
      console.error('Save error:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 夢占い実行
  const handleFortuneTelling = async () => {
    if (!dream || !content.trim()) {
      setError('まず夢の内容を保存してください');
      return;
    }

    if (remainingCount <= 0) {
      setError('本日の夢占い回数上限（20回）に達しました');
      return;
    }

    setIsFortuneTelling(true);
    setError(null);

    try {
      const response = await fetch('/api/dream/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          keywords,
          style: fortuneStyle,
          glossary: glossary.map((g) => ({
            name: g.name,
            description: g.description,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'LIMIT_EXCEEDED') {
          setRemainingCount(0);
          throw new Error(errorData.error);
        }
        throw new Error('夢占いに失敗しました');
      }

      const data = await response.json();
      setRemainingCount(data.remainingCount);

      // 結果を保存
      const supabase = createClient();
      const updated = await updateDream(supabase, dream.id, {
        fortune_result: data.fortune,
        fortune_style: fortuneStyle,
        fortune_at: new Date().toISOString(),
      });

      setDream({ ...updated, keywords: dream.keywords });
      setSuccess('夢占いが完了しました');
    } catch (err) {
      console.error('Fortune telling error:', err);
      setError(err instanceof Error ? err.message : '夢占いに失敗しました');
    } finally {
      setIsFortuneTelling(false);
    }
  };

  // 削除
  const handleDelete = async () => {
    if (!dream) return;

    if (!confirm('この夢記録を削除しますか？')) return;

    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      await deleteDream(supabase, dream.id);
      setDream(null);
      setContent('');
      setKeywords([]);
      setContentHistory([]);
      setSuccess('削除しました');
    } catch (err) {
      console.error('Delete error:', err);
      setError('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const isProcessing =
    isSaving ||
    isFormatting ||
    isFormattingVoice ||
    isDeleting ||
    isExtractingKeywords ||
    isFortuneTelling;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 日付選択 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeDate(-1)}
          disabled={isProcessing}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <DatePicker
          date={parseLocalDate(selectedDate)}
          onDateChange={(date) => {
            setSelectedDate(formatDate(date));
            setSuccess(null);
          }}
          disabled={isProcessing}
          maxDate={new Date()}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => changeDate(1)}
          disabled={isProcessing || selectedDate === formatDate(new Date())}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 入力エリア */}
      <div className="space-y-2">
        <Label htmlFor="content">夢の内容</Label>
        <Textarea
          id="content"
          placeholder="見た夢を記録しましょう..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isProcessing}
          rows={10}
          className="resize-none bg-white text-black"
        />
      </div>

      {/* 音声入力エリア */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>音声入力</Label>
            <VoiceInput onTranscript={handleTranscript} disabled={isProcessing} />
          </div>
          {voiceText && (
            <>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{voiceText}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleFormatAndAdd}
                  disabled={isProcessing}
                >
                  {isFormattingVoice ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  整形して追記
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddWithoutFormat}
                  disabled={isProcessing}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  そのまま追記
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setVoiceText('')}
                  disabled={isProcessing}
                >
                  クリア
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* キーワードエリア */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>キーワード</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExtractKeywords}
              disabled={isProcessing || !content.trim()}
            >
              {isExtractingKeywords ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              自動抽出
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(i)}
                    className="ml-2 hover:text-primary/70"
                    disabled={isProcessing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleFormatAll}
          disabled={isProcessing || !content.trim()}
        >
          {isFormatting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          全文整形
        </Button>
        {contentHistory.length > 0 && (
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={isProcessing}
          >
            <Undo2 className="w-4 h-4 mr-2" />
            戻す
          </Button>
        )}
        <div className="flex-1" />
        {dream && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isProcessing}
            className="text-red-600 hover:text-red-700"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            削除
          </Button>
        )}
        <Button onClick={handleSave} disabled={isProcessing || !content.trim()}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* メッセージ */}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm text-center">{success}</p>
      )}

      {/* 夢占いセクション */}
      {dream && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              夢占い
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 占いスタイル選択 */}
            <div className="space-y-2">
              <Label>占いスタイル</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FORTUNE_STYLE_LABELS) as FortuneStyle[]).map(
                  (style) => (
                    <Button
                      key={style}
                      size="sm"
                      variant={fortuneStyle === style ? 'default' : 'outline'}
                      onClick={() => setFortuneStyle(style)}
                      disabled={isProcessing}
                    >
                      {FORTUNE_STYLE_LABELS[style]}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* 占い実行ボタン */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handleFortuneTelling}
                disabled={isProcessing || remainingCount <= 0}
              >
                {isFortuneTelling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isFortuneTelling ? '占い中...' : '夢を占う'}
              </Button>
              <span className="text-sm text-muted-foreground">
                残り {remainingCount} 回/日
              </span>
            </div>

            {/* 占い結果 */}
            {dream.fortune_result && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {dream.fortune_style &&
                      FORTUNE_STYLE_LABELS[dream.fortune_style]}
                  </span>
                  {dream.fortune_at && (
                    <span>
                      {new Date(dream.fortune_at).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {dream.fortune_result}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
