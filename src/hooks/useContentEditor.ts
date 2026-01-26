'use client';

import { useState, useCallback } from 'react';
import type { VoiceFormatLevel } from '@/lib/supabase/types';

interface UseContentEditorOptions {
  voiceFormatLevel: VoiceFormatLevel;
  initialContent?: string;
}

interface UseContentEditorReturn {
  // State
  content: string;
  setContent: (content: string) => void;
  voiceText: string;
  setVoiceText: (text: string) => void;
  contentHistory: string[];
  isFormatting: boolean;
  isFormattingVoice: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Functions
  handleTranscript: (text: string) => void;
  updateContentWithHistory: (newContent: string) => void;
  handleUndo: () => void;
  handleFormatAll: () => Promise<void>;
  handleFormatAndAdd: () => Promise<void>;
  handleAddWithoutFormat: () => void;
  clearHistory: () => void;
  reset: (newContent?: string) => void;
  canUndo: boolean;
}

export function useContentEditor({
  voiceFormatLevel,
  initialContent = '',
}: UseContentEditorOptions): UseContentEditorReturn {
  const [content, setContent] = useState(initialContent);
  const [voiceText, setVoiceText] = useState('');
  const [contentHistory, setContentHistory] = useState<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isFormattingVoice, setIsFormattingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 音声テキストを追加
  const handleTranscript = useCallback((text: string) => {
    setVoiceText((prev) => prev + text);
  }, []);

  // 履歴付きでコンテンツを更新
  const updateContentWithHistory = useCallback((newContent: string) => {
    setContentHistory((prev) => [...prev, content]);
    setContent(newContent);
  }, [content]);

  // 元に戻す
  const handleUndo = useCallback(() => {
    if (contentHistory.length === 0) return;
    const previousContent = contentHistory[contentHistory.length - 1];
    setContentHistory((prev) => prev.slice(0, -1));
    setContent(previousContent);
  }, [contentHistory]);

  // 全体を整形
  const handleFormatAll = useCallback(async () => {
    if (!content.trim()) return;
    setIsFormatting(true);
    setError(null);
    try {
      const response = await fetch('/api/diary/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, level: voiceFormatLevel }),
      });
      if (!response.ok) throw new Error('整形に失敗しました');
      const data = await response.json();
      updateContentWithHistory(data.formatted);
    } catch (err) {
      console.error('Format error:', err);
      setError('整形に失敗しました');
    } finally {
      setIsFormatting(false);
    }
  }, [content, voiceFormatLevel, updateContentWithHistory]);

  // 音声テキストを整形して追加
  const handleFormatAndAdd = useCallback(async () => {
    if (!voiceText.trim()) return;
    setIsFormattingVoice(true);
    setError(null);
    try {
      const response = await fetch('/api/diary/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceText, level: voiceFormatLevel }),
      });
      if (!response.ok) throw new Error('整形に失敗しました');
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
  }, [voiceText, content, voiceFormatLevel, updateContentWithHistory]);

  // 整形せずに追加
  const handleAddWithoutFormat = useCallback(() => {
    if (!voiceText.trim()) return;
    const newContent = content ? content + '\n\n' + voiceText : voiceText;
    updateContentWithHistory(newContent);
    setVoiceText('');
  }, [voiceText, content, updateContentWithHistory]);

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setContentHistory([]);
  }, []);

  // リセット
  const reset = useCallback((newContent: string = '') => {
    setContent(newContent);
    setVoiceText('');
    setContentHistory([]);
    setError(null);
  }, []);

  return {
    content,
    setContent,
    voiceText,
    setVoiceText,
    contentHistory,
    isFormatting,
    isFormattingVoice,
    error,
    setError,
    handleTranscript,
    updateContentWithHistory,
    handleUndo,
    handleFormatAll,
    handleFormatAndAdd,
    handleAddWithoutFormat,
    clearHistory,
    reset,
    canUndo: contentHistory.length > 0,
  };
}
