'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getTimelineRecords,
  getAllEmotionTags,
  getAllDreamKeywords,
  getAvailableMonths,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  TimelineItemCard,
  DetailPanel,
  YearMonthNavigator,
  SearchFilter,
} from '@/components/reflection';
import type { TimelineItem, TimelineFilters } from '@/lib/supabase/types';

const ITEMS_PER_PAGE = 20;

export default function TimelinePage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // タイムラインデータ
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フィルタ
  const [filters, setFilters] = useState<TimelineFilters>({
    type: 'both',
    keyword: '',
    dateFrom: '2025-01-01',
    dateTo: new Date().toISOString().split('T')[0],
    emotionTags: [],
    dreamKeywords: [],
  });

  // フィルタ用のタグ・キーワード一覧
  const [availableEmotionTags, setAvailableEmotionTags] = useState<string[]>([]);
  const [availableDreamKeywords, setAvailableDreamKeywords] = useState<string[]>([]);

  // 年月ナビゲーター用
  const [availableMonths, setAvailableMonths] = useState<
    Array<{ year: number; month: number }>
  >([]);

  // 詳細パネル
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // スクロール位置記憶用
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 初期データ読み込み
  const loadInitialData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // タグ・キーワード一覧を取得
      const [emotionTags, dreamKeywords, months] = await Promise.all([
        getAllEmotionTags(supabase, user.id),
        getAllDreamKeywords(supabase, user.id),
        getAvailableMonths(supabase, user.id),
      ]);

      setAvailableEmotionTags(emotionTags);
      setAvailableDreamKeywords(dreamKeywords);
      setAvailableMonths(months);

      // タイムラインを取得
      const result = await getTimelineRecords(supabase, user.id, {
        limit: ITEMS_PER_PAGE,
        filters,
      });

      setItems(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setError('タイムラインの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  // フィルタ変更時にリロード
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    loadInitialData();
  }, [loadInitialData]);

  // 追加データ読み込み
  const loadMore = useCallback(async () => {
    if (!user || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const supabase = createClient();
      const result = await getTimelineRecords(supabase, user.id, {
        limit: ITEMS_PER_PAGE,
        cursor: cursor || undefined,
        filters,
      });

      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, hasMore, isLoadingMore, cursor, filters]);

  // 無限スクロール
  const loadMoreRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
  });

  // アイテムクリック
  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };

  // 年月ジャンプ
  const handleJump = (year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const element = monthRefs.current.get(key);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 月ごとにグループ化
  const groupedItems = items.reduce(
    (acc, item) => {
      const [year, month] = item.date.split('-');
      const key = `${year}-${month}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, TimelineItem[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-4xl mx-auto">
      {/* メインコンテンツ */}
      <div className="flex-1 space-y-6" ref={scrollContainerRef}>
        <h1 className="text-2xl font-bold">タイムライン</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 検索・フィルタ */}
        <SearchFilter
          filters={filters}
          onFiltersChange={setFilters}
          availableEmotionTags={availableEmotionTags}
          availableDreamKeywords={availableDreamKeywords}
        />

        {/* タイムライン */}
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            記録がありません
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([key, monthItems]) => {
                const [year, month] = key.split('-');
                return (
                  <div
                    key={key}
                    ref={(el) => {
                      if (el) monthRefs.current.set(key, el);
                    }}
                  >
                    <h2 className="text-lg font-semibold mb-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                      {parseInt(year)}年{parseInt(month)}月
                    </h2>
                    <div className="space-y-3">
                      {monthItems.map((item) => (
                        <TimelineItemCard
                          key={item.id}
                          item={item}
                          onClick={() => handleItemClick(item)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* 無限スクロールのトリガー */}
            <div ref={loadMoreRef} className="py-4">
              {isLoadingMore && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 年月ナビゲーター（PCのみサイドバー表示） */}
      {!isMobile && (
        <YearMonthNavigator
          availableMonths={availableMonths}
          onJump={handleJump}
        />
      )}

      {/* 年月ナビゲーター（モバイル用フローティングボタン） */}
      {isMobile && (
        <YearMonthNavigator
          availableMonths={availableMonths}
          onJump={handleJump}
        />
      )}

      {/* 詳細パネル */}
      <DetailPanel
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        item={selectedItem}
      />
    </div>
  );
}
