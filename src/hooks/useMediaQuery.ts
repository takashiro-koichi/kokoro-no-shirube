'use client';

import { useSyncExternalStore } from 'react';

// メディアクエリを監視するカスタムHook（useSyncExternalStore版）
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', callback);
    return () => media.removeEventListener('change', callback);
  };

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    // SSR時はfalseを返す
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// モバイル判定（768px以下）
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

// タブレット判定（768px〜1024px）
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

// デスクトップ判定（1024px以上）
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}
