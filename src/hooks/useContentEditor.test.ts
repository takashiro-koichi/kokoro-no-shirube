import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentEditor } from './useContentEditor';
import type { VoiceFormatLevel } from '@/lib/supabase/types';

describe('useContentEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('初期状態', () => {
    it('デフォルト値で初期化される', () => {
      const { result } = renderHook(() =>
        useContentEditor({ voiceFormatLevel: 'light' })
      );

      expect(result.current.content).toBe('');
      expect(result.current.voiceText).toBe('');
      expect(result.current.contentHistory).toEqual([]);
      expect(result.current.isFormatting).toBe(false);
      expect(result.current.isFormattingVoice).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.canUndo).toBe(false);
    });

    it('初期コンテンツを設定できる', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '初期テキスト',
        })
      );

      expect(result.current.content).toBe('初期テキスト');
    });
  });

  describe('handleTranscript', () => {
    it('音声テキストに追加される', () => {
      const { result } = renderHook(() =>
        useContentEditor({ voiceFormatLevel: 'light' })
      );

      act(() => {
        result.current.handleTranscript('テスト');
      });

      expect(result.current.voiceText).toBe('テスト');
    });

    it('既存のテキストに連結される', () => {
      const { result } = renderHook(() =>
        useContentEditor({ voiceFormatLevel: 'light' })
      );

      act(() => {
        result.current.handleTranscript('最初');
        result.current.handleTranscript('の続き');
      });

      expect(result.current.voiceText).toBe('最初の続き');
    });
  });

  describe('updateContentWithHistory', () => {
    it('コンテンツが更新され履歴に保存される', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '古いコンテンツ',
        })
      );

      act(() => {
        result.current.updateContentWithHistory('新しいコンテンツ');
      });

      expect(result.current.content).toBe('新しいコンテンツ');
      expect(result.current.contentHistory).toEqual(['古いコンテンツ']);
      expect(result.current.canUndo).toBe(true);
    });

    it('複数回の更新で履歴が蓄積される', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '1',
        })
      );

      act(() => {
        result.current.updateContentWithHistory('2');
      });
      act(() => {
        result.current.updateContentWithHistory('3');
      });

      expect(result.current.content).toBe('3');
      expect(result.current.contentHistory).toEqual(['1', '2']);
    });
  });

  describe('handleUndo', () => {
    it('前の状態に戻る', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '古いコンテンツ',
        })
      );

      act(() => {
        result.current.updateContentWithHistory('新しいコンテンツ');
      });
      act(() => {
        result.current.handleUndo();
      });

      expect(result.current.content).toBe('古いコンテンツ');
      expect(result.current.contentHistory).toEqual([]);
      expect(result.current.canUndo).toBe(false);
    });

    it('履歴が空の場合は何もしない', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: 'テスト',
        })
      );

      act(() => {
        result.current.handleUndo();
      });

      expect(result.current.content).toBe('テスト');
    });

    it('複数回のUndoが正しく動作する', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '1',
        })
      );

      act(() => {
        result.current.updateContentWithHistory('2');
      });
      act(() => {
        result.current.updateContentWithHistory('3');
      });
      act(() => {
        result.current.handleUndo();
      });

      expect(result.current.content).toBe('2');

      act(() => {
        result.current.handleUndo();
      });

      expect(result.current.content).toBe('1');
    });
  });

  describe('handleAddWithoutFormat', () => {
    it('音声テキストを整形せずに追加する', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '既存のテキスト',
        })
      );

      act(() => {
        result.current.setVoiceText('追加テキスト');
      });
      act(() => {
        result.current.handleAddWithoutFormat();
      });

      expect(result.current.content).toBe('既存のテキスト\n\n追加テキスト');
      expect(result.current.voiceText).toBe('');
      expect(result.current.contentHistory).toEqual(['既存のテキスト']);
    });

    it('コンテンツが空の場合は改行なしで追加', () => {
      const { result } = renderHook(() =>
        useContentEditor({ voiceFormatLevel: 'light' })
      );

      act(() => {
        result.current.setVoiceText('追加テキスト');
      });
      act(() => {
        result.current.handleAddWithoutFormat();
      });

      expect(result.current.content).toBe('追加テキスト');
    });

    it('空白のみの音声テキストは追加されない', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: 'テスト',
        })
      );

      act(() => {
        result.current.setVoiceText('   ');
      });
      act(() => {
        result.current.handleAddWithoutFormat();
      });

      expect(result.current.content).toBe('テスト');
      expect(result.current.contentHistory).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('履歴がクリアされる', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '1',
        })
      );

      act(() => {
        result.current.updateContentWithHistory('2');
        result.current.updateContentWithHistory('3');
      });
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.contentHistory).toEqual([]);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.content).toBe('3'); // コンテンツは変わらない
    });
  });

  describe('reset', () => {
    it('すべての状態がリセットされる', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: 'テスト',
        })
      );

      act(() => {
        result.current.setVoiceText('音声');
        result.current.updateContentWithHistory('更新');
        result.current.setError('エラー');
      });
      act(() => {
        result.current.reset();
      });

      expect(result.current.content).toBe('');
      expect(result.current.voiceText).toBe('');
      expect(result.current.contentHistory).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('新しいコンテンツでリセットできる', () => {
      const { result } = renderHook(() =>
        useContentEditor({
          voiceFormatLevel: 'light',
          initialContent: '古い',
        })
      );

      act(() => {
        result.current.reset('新しい');
      });

      expect(result.current.content).toBe('新しい');
    });
  });

  describe('voiceFormatLevel の変更', () => {
    it('voiceFormatLevel が変更されても動作する', () => {
      const { result, rerender } = renderHook(
        ({ level }: { level: VoiceFormatLevel }) =>
          useContentEditor({ voiceFormatLevel: level }),
        { initialProps: { level: 'light' as VoiceFormatLevel } }
      );

      expect(result.current.content).toBe('');

      rerender({ level: 'thorough' });

      expect(result.current.content).toBe('');
    });
  });
});
