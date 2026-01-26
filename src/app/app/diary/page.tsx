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
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getDiaryByDate,
  createDiary,
  updateDiary,
  deleteDiary,
  getUserSettings,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VoiceInput } from '@/components/common/VoiceInput';
import { DatePicker, parseLocalDate } from '@/components/common/DatePicker';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useSharedDate } from '@/hooks/useSharedDate';
import { useContentEditor } from '@/hooks/useContentEditor';
import type { Diary, VoiceFormatLevel } from '@/lib/supabase/types';

export default function DiaryPage() {
  const { user } = useAuth();
  const { selectedDate, setSelectedDate, changeDate, formatDate } = useSharedDate();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [voiceFormatLevel, setVoiceFormatLevel] =
    useState<VoiceFormatLevel>('thorough');

  // コンテンツエディタフック
  const editor = useContentEditor({ voiceFormatLevel });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingSummary, setIsUpdatingSummary] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // 日記と設定を読み込む
  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    editor.setError(null);

    try {
      const supabase = createClient();

      // 設定と日記を並列取得
      const [settings, diaryData] = await Promise.all([
        getUserSettings(supabase, user.id),
        getDiaryByDate(supabase, user.id, selectedDate),
      ]);

      // 設定を反映
      if (settings) {
        setVoiceFormatLevel(settings.voice_format_level);
      }

      // 日記を反映
      setDiary(diaryData);
      editor.reset(diaryData?.content || '');
    } catch (err) {
      console.error('Failed to load diary:', err);
      editor.setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate, editor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 日付変更（successをクリア）
  const handleChangeDate = (days: number) => {
    changeDate(days);
    setSuccess(null);
  };

  // 保存
  const handleSave = async () => {
    if (!user || !editor.content.trim()) return;

    setIsSaving(true);
    editor.setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      let savedDiary: Diary;

      if (diary) {
        // 更新
        savedDiary = await updateDiary(supabase, diary.id, {
          content: editor.content,
          content_updated_at: new Date().toISOString(),
        });
      } else {
        // 新規作成
        savedDiary = await createDiary(supabase, {
          user_id: user.id,
          date: selectedDate,
          content: editor.content,
        });
      }

      // AI分析（感情タグ・要約生成）
      try {
        const analyzeResponse = await fetch('/api/diary/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editor.content }),
        });

        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          savedDiary = await updateDiary(supabase, savedDiary.id, {
            summary: analyzeData.summary,
            emotion_tags: analyzeData.emotion_tags,
          });
        }
      } catch (analyzeErr) {
        console.error('Analyze error:', analyzeErr);
        // 分析失敗しても保存は成功とする
      }

      setDiary(savedDiary);
      setSuccess('保存しました');
      editor.clearHistory(); // 保存後は履歴をクリア
    } catch (err) {
      console.error('Save error:', err);
      editor.setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 削除
  const handleDelete = async () => {
    if (!diary) return;

    if (!confirm('この日記を削除しますか？')) return;

    setIsDeleting(true);
    editor.setError(null);

    try {
      const supabase = createClient();
      await deleteDiary(supabase, diary.id);
      setDiary(null);
      editor.reset();
      setSuccess('削除しました');
    } catch (err) {
      console.error('Delete error:', err);
      editor.setError('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // 要約更新
  const handleUpdateSummary = async () => {
    if (!diary || !editor.content.trim()) return;

    setIsUpdatingSummary(true);
    editor.setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const analyzeResponse = await fetch('/api/diary/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.content }),
      });

      if (!analyzeResponse.ok) {
        throw new Error('分析に失敗しました');
      }

      const analyzeData = await analyzeResponse.json();
      const updatedDiary = await updateDiary(supabase, diary.id, {
        summary: analyzeData.summary,
        emotion_tags: analyzeData.emotion_tags,
      });

      setDiary(updatedDiary);
      setSuccess('要約を更新しました');
    } catch (err) {
      console.error('Update summary error:', err);
      editor.setError('要約の更新に失敗しました');
    } finally {
      setIsUpdatingSummary(false);
    }
  };

  const isProcessing = isSaving || editor.isFormatting || editor.isFormattingVoice || isDeleting || isUpdatingSummary;
  const isToday = selectedDate === formatDate(new Date());

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
        <Label htmlFor="content">日記</Label>
        <Textarea
          id="content"
          placeholder="今日あったことを書いてみましょう..."
          value={editor.content}
          onChange={(e) => editor.setContent(e.target.value)}
          disabled={isProcessing}
          rows={40}
          className="resize-none bg-white text-black"
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
          全文整形する
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
        {diary && (
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

      {/* 分析結果 */}
      {diary && (diary.summary || diary.emotion_tags?.length) && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">分析結果</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleUpdateSummary}
                      disabled={isProcessing || !editor.content.trim()}
                    >
                      {isUpdatingSummary ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>要約を更新</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {diary.emotion_tags && diary.emotion_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {diary.emotion_tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {diary.summary && (
              <p className="text-sm text-muted-foreground">{diary.summary}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
