'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kokoro-selected-date';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getTodayString(): string {
  return formatDate(new Date());
}

export function useSharedDate() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [isHydrated, setIsHydrated] = useState(false);

  // クライアントサイドでlocalStorageから読み込み
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedDate(stored);
    }
    setIsHydrated(true);
  }, []);

  // localStorageに保存
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, selectedDate);
    }
  }, [selectedDate, isHydrated]);

  // 日付変更関数
  const changeDate = useCallback((days: number) => {
    setSelectedDate((prev) => {
      const date = new Date(prev);
      date.setDate(date.getDate() + days);
      return formatDate(date);
    });
  }, []);

  return { selectedDate, setSelectedDate, changeDate, formatDate };
}
