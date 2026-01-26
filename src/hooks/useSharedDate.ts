'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'kokoro-selected-date';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getTodayString(): string {
  return formatDate(new Date());
}

// localStorageの変更を監視するstore
function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || getTodayString();
}

function getServerSnapshot(): string {
  return getTodayString();
}

export function useSharedDate() {
  // useSyncExternalStoreでlocalStorageを監視（SSR安全）
  const storedDate = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot
  );

  const [selectedDate, setSelectedDateState] = useState<string>(storedDate);

  // storedDateが変わったら同期
  useEffect(() => {
    setSelectedDateState(storedDate);
  }, [storedDate]);

  // localStorageに保存し、状態も更新
  const setSelectedDate = useCallback((date: string) => {
    localStorage.setItem(STORAGE_KEY, date);
    setSelectedDateState(date);
  }, []);

  // 日付変更関数
  const changeDate = useCallback((days: number) => {
    setSelectedDateState((prev) => {
      const date = new Date(prev);
      date.setDate(date.getDate() + days);
      const newDate = formatDate(date);
      localStorage.setItem(STORAGE_KEY, newDate);
      return newDate;
    });
  }, []);

  return { selectedDate, setSelectedDate, changeDate, formatDate };
}
