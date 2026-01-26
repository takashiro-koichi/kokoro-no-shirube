import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSharedDate } from './useSharedDate';

describe('useSharedDate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-26T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初期化', () => {
    it('初期値は今日の日付', () => {
      const { result } = renderHook(() => useSharedDate());
      expect(result.current.selectedDate).toBe('2025-01-26');
    });

    it('localStorageに保存された日付を復元する', async () => {
      localStorage.setItem('kokoro-selected-date', '2025-01-20');

      const { result } = renderHook(() => useSharedDate());

      // useEffectの実行を待つ
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.selectedDate).toBe('2025-01-20');
    });
  });

  describe('formatDate', () => {
    it('Dateオブジェクトを YYYY-MM-DD 形式に変換する', () => {
      const { result } = renderHook(() => useSharedDate());
      const date = new Date('2025-03-15');
      expect(result.current.formatDate(date)).toBe('2025-03-15');
    });

    it('1桁の月日もゼロパディングする', () => {
      const { result } = renderHook(() => useSharedDate());
      const date = new Date('2025-01-05');
      expect(result.current.formatDate(date)).toBe('2025-01-05');
    });
  });

  describe('setSelectedDate', () => {
    it('日付を直接設定できる', async () => {
      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.setSelectedDate('2025-02-14');
      });

      expect(result.current.selectedDate).toBe('2025-02-14');
    });

    it('設定した日付がlocalStorageに保存される', async () => {
      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.setSelectedDate('2025-02-14');
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(localStorage.getItem('kokoro-selected-date')).toBe('2025-02-14');
    });
  });

  describe('changeDate', () => {
    it('正の値で日付を進める', async () => {
      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.changeDate(1);
      });

      expect(result.current.selectedDate).toBe('2025-01-27');
    });

    it('負の値で日付を戻す', async () => {
      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.changeDate(-1);
      });

      expect(result.current.selectedDate).toBe('2025-01-25');
    });

    it('複数日進める', async () => {
      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.changeDate(5);
      });

      expect(result.current.selectedDate).toBe('2025-01-31');
    });

    it('月をまたいで日付を変更できる', async () => {
      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.changeDate(10);
      });

      expect(result.current.selectedDate).toBe('2025-02-05');
    });

    it('年をまたいで日付を変更できる', async () => {
      vi.setSystemTime(new Date('2025-12-30T12:00:00'));

      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.changeDate(5);
      });

      expect(result.current.selectedDate).toBe('2026-01-04');
    });

    it('過去の年へも移動できる', async () => {
      vi.setSystemTime(new Date('2025-01-02T12:00:00'));

      const { result } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result.current.changeDate(-5);
      });

      expect(result.current.selectedDate).toBe('2024-12-28');
    });
  });

  describe('ページ間での日付共有', () => {
    it('異なるフックインスタンスでlocalStorageを通じて日付を共有する', async () => {
      const { result: result1 } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      act(() => {
        result1.current.setSelectedDate('2025-03-20');
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // 新しいフックインスタンスはlocalStorageから日付を読み込む
      const { result: result2 } = renderHook(() => useSharedDate());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result2.current.selectedDate).toBe('2025-03-20');
    });
  });
});
