import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from './useMediaQuery';

describe('useMediaQuery', () => {
  // matchMediaのモックを作成するヘルパー
  const mockMatchMedia = (matches: boolean) => {
    const listeners: Array<() => void> = [];
    const mediaQueryList = {
      matches,
      media: '',
      onchange: null,
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'change') {
          listeners.push(callback);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };

    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => mediaQueryList),
    });

    return {
      mediaQueryList,
      triggerChange: (newMatches: boolean) => {
        mediaQueryList.matches = newMatches;
        listeners.forEach((listener) => listener());
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMediaQuery', () => {
    it('クエリがマッチする場合はtrueを返す', () => {
      mockMatchMedia(true);

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(result.current).toBe(true);
    });

    it('クエリがマッチしない場合はfalseを返す', () => {
      mockMatchMedia(false);

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(result.current).toBe(false);
    });

    it('matchMediaが正しいクエリで呼ばれる', () => {
      mockMatchMedia(false);

      renderHook(() => useMediaQuery('(min-width: 1024px)'));

      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('changeイベントリスナーが登録される', () => {
      const { mediaQueryList } = mockMatchMedia(false);

      renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('アンマウント時にリスナーが削除される', () => {
      const { mediaQueryList } = mockMatchMedia(false);

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      unmount();

      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('useIsMobile', () => {
    it('768px以下でtrueを返す', () => {
      mockMatchMedia(true);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
    });

    it('769px以上でfalseを返す', () => {
      mockMatchMedia(false);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('769px〜1024pxでtrueを返す', () => {
      mockMatchMedia(true);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith(
        '(min-width: 769px) and (max-width: 1024px)'
      );
    });

    it('範囲外でfalseを返す', () => {
      mockMatchMedia(false);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('1025px以上でtrueを返す', () => {
      mockMatchMedia(true);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1025px)');
    });

    it('1024px以下でfalseを返す', () => {
      mockMatchMedia(false);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });
  });
});
