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
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useSharedDate } from '@/hooks/useSharedDate';
import { useContentEditor } from '@/hooks/useContentEditor';
import type {
  DreamWithKeywords,
  VoiceFormatLevel,
  FortuneStyle,
  UserGlossary,
} from '@/lib/supabase/types';

const FORTUNE_STYLE_LABELS: Record<FortuneStyle, string> = {
  jung: 'ユング派',
  freud: 'フロイト派',
  cognitive: '認知的アプローチ',
};

export default function DreamPage() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate, changeDate, formatDate } = useSharedDate();
  const [dream, setDream] = useState<DreamWithKeywords | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [voiceFormatLevel, setVoiceFormatLevel] =
    useState<VoiceFormatLevel>('thorough');
  const [fortuneStyle, setFortuneStyle] = useState<FortuneStyle>('jung');
  const [glossary, setGlossary] = useState<UserGlossary[]>([]);
  const [remainingCount, setRemainingCount] = useState<number>(20);

  // コンテンツエディタフック
  const editor = useContentEditor({ voiceFormatLevel });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [isFortuneTelling, setIsFortuneTelling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // 夢記録と設定を読み込む
  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    editor.setError(null);

    try {
      const supabase = createClient();

      // すべてのデータを並列取得
      const [settings, glossaryData, limitStatus, dreamData] = await Promise.all([
        getUserSettings(supabase, user.id),
        getUserGlossary(supabase, user.id),
        checkFortuneLimit(supabase, user.id),
        getDreamByDate(supabase, user.id, selectedDate),
      ]);

      // 設定を反映
      if (settings) {
        setVoiceFormatLevel(settings.voice_format_level);
        setFortuneStyle(settings.fortune_style);
      }

      // 固有名詞を反映
      setGlossary(glossaryData);

      // API制限を反映
      setRemainingCount(limitStatus.remainingCount);

      // 夢記録を反映
      setDream(dreamData);
      editor.reset(dreamData?.content || '');
      setKeywords(dreamData?.keywords.map((k) => k.keyword) || []);
    } catch (err) {
      console.error('Failed to load dream:', err);
      editor.setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 日付変更（successをクリア）
  const handleChangeDate = (days: number) => {
    changeDate(days);
    setSuccess(null);
  };

  // キーワード抽出
  const handleExtractKeywords = async () => {
    if (!editor.content.trim()) return;

    setIsExtractingKeywords(true);
    editor.setError(null);

    try {
      const response = await fetch('/api/dream/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.content }),
      });

      if (!response.ok) {
        throw new Error('キーワード抽出に失敗しました');
      }

      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      console.error('Keywords error:', err);
      editor.setError('キーワード抽出に失敗しました');
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
    if (!user || !editor.content.trim()) return;

    setIsSaving(true);
    editor.setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      let savedDream: DreamWithKeywords;

      if (dream) {
        // 更新
        const updated = await updateDream(supabase, dream.id, {
          content: editor.content,
          content_updated_at: new Date().toISOString(),
        });
        savedDream = { ...updated, keywords: dream.keywords };
      } else {
        // 新規作成
        const created = await createDream(supabase, {
          user_id: user.id,
          date: selectedDate,
          content: editor.content,
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
      editor.clearHistory();
    } catch (err) {
      console.error('Save error:', err);
      editor.setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 夢占い実行
  const handleFortuneTelling = async () => {
    if (!dream || !editor.content.trim()) {
      editor.setError('まず夢の内容を保存してください');
      return;
    }

    if (remainingCount <= 0) {
      editor.setError('本日の夢占い回数上限（20回）に達しました');
      return;
    }

    setIsFortuneTelling(true);
    editor.setError(null);

    try {
      const response = await fetch('/api/dream/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editor.content,
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
      editor.setError(err instanceof Error ? err.message : '夢占いに失敗しました');
    } finally {
      setIsFortuneTelling(false);
    }
  };

  // 削除
  const handleDelete = async () => {
    if (!dream) return;

    if (!confirm('この夢記録を削除しますか？')) return;

    setIsDeleting(true);
    editor.setError(null);

    try {
      const supabase = createClient();
      await deleteDream(supabase, dream.id);
      setDream(null);
      editor.reset();
      setKeywords([]);
      setSuccess('削除しました');
    } catch (err) {
      console.error('Delete error:', err);
      editor.setError('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const isProcessing =
    isSaving ||
    editor.isFormatting ||
    editor.isFormattingVoice ||
    isDeleting ||
    isExtractingKeywords ||
    isFortuneTelling;
  const todayStr = formatDate(new Date());
  const isToday = selectedDate === todayStr;

  // スワイプナビゲーション
  const swipeRef = useSwipeNavigation<HTMLDivElement>({
    onSwipeLeft: () => !isToday && !isProcessing && handleChangeDate(1),
    onSwipeRight: () => !isProcessing && handleChangeDate(-1),
    enabled: !isProcessing,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div ref={swipeRef} className="space-y-6 max-w-2xl mx-auto">
      {/* 日付選択 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleChangeDate(-1)}
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
          onClick={() => handleChangeDate(1)}
          disabled={isProcessing || isToday}
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
          value={editor.content}
          onChange={(e) => editor.setContent(e.target.value)}
          disabled={isProcessing}
          rows={9}
          className="resize-none bg-white text-black"
          style={{ minHeight: '120px', fieldSizing: 'fixed' }}
        />
      </div>

      {/* 音声入力エリア */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>音声入力</Label>
            <VoiceInput onTranscript={editor.handleTranscript} disabled={isProcessing} />
          </div>
          {editor.voiceText && (
            <>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{editor.voiceText}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={editor.handleFormatAndAdd}
                  disabled={isProcessing}
                >
                  {editor.isFormattingVoice ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  整形して追記
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={editor.handleAddWithoutFormat}
                  disabled={isProcessing}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  そのまま追記
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.setVoiceText('')}
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
              disabled={isProcessing || !editor.content.trim()}
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
          onClick={editor.handleFormatAll}
          disabled={isProcessing || !editor.content.trim()}
        >
          {editor.isFormatting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          全文整形
        </Button>
        {editor.canUndo && (
          <Button
            variant="outline"
            onClick={editor.handleUndo}
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
        <Button onClick={handleSave} disabled={isProcessing || !editor.content.trim()}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* メッセージ */}
      {editor.error && <p className="text-red-500 text-sm text-center">{editor.error}</p>}
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
