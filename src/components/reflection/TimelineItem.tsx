'use client';

import { BookOpen, Moon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TimelineItem as TimelineItemType } from '@/lib/supabase/types';
import { emotionTagToEmoji } from '@/lib/utils/emotion';

interface TimelineItemCardProps {
  item: TimelineItemType;
  onClick: () => void;
}

export function TimelineItemCard({ item, onClick }: TimelineItemCardProps) {
  const isDiary = item.type === 'diary';
  const emoji = isDiary ? emotionTagToEmoji(item.emotion_tags) : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()}（${days[date.getDay()]}）`;
  };

  // 本文のプレビュー（最初の100文字）
  const contentPreview =
    item.content.length > 100
      ? item.content.substring(0, 100) + '...'
      : item.content;

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* アイコン */}
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${isDiary ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'}
            `}
          >
            {isDiary ? (
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            ) : (
              <Moon className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* ヘッダー */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{formatDate(item.date)}</span>
              <Badge variant={isDiary ? 'secondary' : 'outline'}>
                {isDiary ? '日記' : '夢記録'}
              </Badge>
              {emoji && <span className="text-lg">{emoji}</span>}
            </div>

            {/* 要約または内容プレビュー */}
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.summary || contentPreview}
            </p>

            {/* 感情タグまたは夢キーワード */}
            {isDiary && item.emotion_tags && item.emotion_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.emotion_tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.emotion_tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.emotion_tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {!isDiary && item.dream_keywords && item.dream_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.dream_keywords.slice(0, 3).map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {item.dream_keywords.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.dream_keywords.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
