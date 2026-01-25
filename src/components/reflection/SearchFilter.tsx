'use client';

import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { TimelineFilters } from '@/lib/supabase/types';

interface SearchFilterProps {
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  availableEmotionTags: string[];
  availableDreamKeywords: string[];
}

export function SearchFilter({
  filters,
  onFiltersChange,
  availableEmotionTags,
  availableDreamKeywords,
}: SearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [keywordInput, setKeywordInput] = useState(filters.keyword);

  // キーワード検索（Enterで実行）
  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, keyword: keywordInput });
  };

  // 種類フィルタ
  const handleTypeChange = (type: TimelineFilters['type']) => {
    onFiltersChange({ ...filters, type });
  };

  // 期間フィルタ
  const handleDateChange = (key: 'dateFrom' | 'dateTo', value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // 感情タグフィルタ
  const toggleEmotionTag = (tag: string) => {
    const current = filters.emotionTags;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onFiltersChange({ ...filters, emotionTags: updated });
  };

  // 夢キーワードフィルタ
  const toggleDreamKeyword = (keyword: string) => {
    const current = filters.dreamKeywords;
    const updated = current.includes(keyword)
      ? current.filter((k) => k !== keyword)
      : [...current, keyword];
    onFiltersChange({ ...filters, dreamKeywords: updated });
  };

  // フィルタをリセット
  const resetFilters = () => {
    const defaultFilters: TimelineFilters = {
      type: 'both',
      keyword: '',
      dateFrom: '2025-01-01',
      dateTo: new Date().toISOString().split('T')[0],
      emotionTags: [],
      dreamKeywords: [],
    };
    setKeywordInput('');
    onFiltersChange(defaultFilters);
  };

  // アクティブなフィルタ数
  const activeFilterCount =
    (filters.keyword ? 1 : 0) +
    (filters.type !== 'both' ? 1 : 0) +
    (filters.emotionTags.length > 0 ? 1 : 0) +
    (filters.dreamKeywords.length > 0 ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* シンプルUI */}
      <div className="flex gap-2">
        {/* キーワード検索 */}
        <form onSubmit={handleKeywordSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="キーワード検索..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            検索
          </Button>
        </form>

        {/* 詳細フィルタ展開ボタン */}
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          フィルタ
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-2" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-2" />
          )}
        </Button>
      </div>

      {/* 種類トグル */}
      <div className="flex gap-2">
        <Button
          variant={filters.type === 'both' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('both')}
        >
          すべて
        </Button>
        <Button
          variant={filters.type === 'diary' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('diary')}
        >
          日記のみ
        </Button>
        <Button
          variant={filters.type === 'dream' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('dream')}
        >
          夢のみ
        </Button>
      </div>

      {/* 詳細フィルタ（展開時） */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          {/* 期間 */}
          <div className="space-y-2">
            <Label>期間</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">〜</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                className="w-36"
              />
            </div>
          </div>

          {/* 感情タグ */}
          {availableEmotionTags.length > 0 && (
            <div className="space-y-2">
              <Label>感情タグ</Label>
              <div className="flex flex-wrap gap-2">
                {availableEmotionTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={
                      filters.emotionTags.includes(tag) ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleEmotionTag(tag)}
                  >
                    {tag}
                    {filters.emotionTags.includes(tag) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 夢キーワード */}
          {availableDreamKeywords.length > 0 && (
            <div className="space-y-2">
              <Label>夢キーワード</Label>
              <div className="flex flex-wrap gap-2">
                {availableDreamKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant={
                      filters.dreamKeywords.includes(keyword)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleDreamKeyword(keyword)}
                  >
                    {keyword}
                    {filters.dreamKeywords.includes(keyword) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* リセットボタン */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              フィルタをリセット
            </Button>
          </div>
        </div>
      )}

      {/* アクティブなフィルタ表示 */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {filters.keyword && (
            <Badge variant="secondary">
              キーワード: {filters.keyword}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  setKeywordInput('');
                  onFiltersChange({ ...filters, keyword: '' });
                }}
              />
            </Badge>
          )}
          {filters.emotionTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => toggleEmotionTag(tag)}
              />
            </Badge>
          ))}
          {filters.dreamKeywords.map((keyword) => (
            <Badge key={keyword} variant="secondary">
              {keyword}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => toggleDreamKeyword(keyword)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
