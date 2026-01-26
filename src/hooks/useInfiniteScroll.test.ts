import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

describe('useInfiniteScroll', () => {
  describe('setTargetRef の返却', () => {
    it('コールバック関数を返す', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore: vi.fn(),
          hasMore: true,
          isLoading: false,
        })
      );

      expect(typeof result.current).toBe('function');
    });
  });

  describe('基本的な動作', () => {
    it('hasMore=true, isLoading=false で初期化できる', () => {
      const onLoadMore = vi.fn();

      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
        })
      );

      expect(result.current).toBeDefined();
    });

    it('hasMore=false で初期化できる', () => {
      const onLoadMore = vi.fn();

      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: false,
          isLoading: false,
        })
      );

      expect(result.current).toBeDefined();
    });

    it('isLoading=true で初期化できる', () => {
      const onLoadMore = vi.fn();

      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: true,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('オプション', () => {
    it('カスタムthresholdを指定できる', () => {
      const onLoadMore = vi.fn();

      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
          threshold: 0.5,
        })
      );

      expect(result.current).toBeDefined();
    });

    it('カスタムrootMarginを指定できる', () => {
      const onLoadMore = vi.fn();

      const { result } = renderHook(() =>
        useInfiniteScroll({
          onLoadMore,
          hasMore: true,
          isLoading: false,
          rootMargin: '200px',
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('状態の変更', () => {
    it('hasMoreがtrueからfalseに変わっても動作する', () => {
      const onLoadMore = vi.fn();

      const { result, rerender } = renderHook(
        ({ hasMore }) =>
          useInfiniteScroll({
            onLoadMore,
            hasMore,
            isLoading: false,
          }),
        { initialProps: { hasMore: true } }
      );

      expect(result.current).toBeDefined();

      rerender({ hasMore: false });

      expect(result.current).toBeDefined();
    });

    it('isLoadingがfalseからtrueに変わっても動作する', () => {
      const onLoadMore = vi.fn();

      const { result, rerender } = renderHook(
        ({ isLoading }) =>
          useInfiniteScroll({
            onLoadMore,
            hasMore: true,
            isLoading,
          }),
        { initialProps: { isLoading: false } }
      );

      expect(result.current).toBeDefined();

      rerender({ isLoading: true });

      expect(result.current).toBeDefined();
    });
  });

  // Note: IntersectionObserver のコールバック発火テストは
  // より複雑なセットアップが必要なため、E2Eテストで実施する
});
