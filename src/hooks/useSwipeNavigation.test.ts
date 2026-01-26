import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipeNavigation } from './useSwipeNavigation';

describe('useSwipeNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ref の返却', () => {
    it('refオブジェクトを返す', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: vi.fn(),
          onSwipeRight: vi.fn(),
        })
      );

      expect(result.current).toBeDefined();
      expect(result.current.current).toBeNull();
    });
  });

  describe('オプションのデフォルト値', () => {
    it('thresholdなしでも動作する', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeRight: vi.fn(),
        })
      );

      expect(result.current).toBeDefined();
    });

    it('enabledなしでも動作する', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeRight: vi.fn(),
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('enabled=false の場合', () => {
    it('enabled=false でもrefは返される', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeRight: vi.fn(),
          enabled: false,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('コールバック関数', () => {
    it('onSwipeLeftのみ指定できる', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: vi.fn(),
        })
      );

      expect(result.current).toBeDefined();
    });

    it('onSwipeRightのみ指定できる', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeRight: vi.fn(),
        })
      );

      expect(result.current).toBeDefined();
    });

    it('両方のコールバックを指定できる', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: vi.fn(),
          onSwipeRight: vi.fn(),
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('カスタムthreshold', () => {
    it('カスタムthresholdを指定できる', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeRight: vi.fn(),
          threshold: 100,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  // Note: Touch event testing requires more complex setup with actual DOM mounting.
  // The swipe detection logic is tested through integration/e2e tests.
});
