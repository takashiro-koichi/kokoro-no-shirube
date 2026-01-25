'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Moon, Edit2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TimelineItem } from '@/lib/supabase/types';
import { emotionTagToEmoji } from '@/lib/utils/emotion';

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TimelineItem | null;
}

export function DetailPanel({ open, onOpenChange, item }: DetailPanelProps) {
  const router = useRouter();

  if (!item) return null;

  const isDiary = item.type === 'diary';
  const emoji = isDiary ? emotionTagToEmoji(item.emotion_tags) : null;

  const handleEdit = () => {
    const path = isDiary
      ? `/app/diary?date=${item.date}`
      : `/app/dream?date=${item.date}`;
    router.push(path);
    onOpenChange(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {isDiary ? (
              <BookOpen className="w-5 h-5 text-blue-500" />
            ) : (
              <Moon className="w-5 h-5 text-purple-500" />
            )}
            <SheetTitle>{isDiary ? '日記' : '夢記録'}</SheetTitle>
          </div>
          <SheetDescription>{formatDate(item.date)}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {/* 感情タグ（日記の場合） */}
          {isDiary && item.emotion_tags && item.emotion_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emoji && <span className="text-2xl">{emoji}</span>}
              {item.emotion_tags.map((tag, i) => (
                <Badge key={i} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 夢キーワード（夢の場合） */}
          {!isDiary && item.dream_keywords && item.dream_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.dream_keywords.map((keyword, i) => (
                <Badge key={i} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}

          {/* 要約（日記の場合） */}
          {isDiary && item.summary && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                要約
              </p>
              <p className="text-sm">{item.summary}</p>
            </div>
          )}

          {/* 本文 */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {isDiary ? '日記内容' : '夢の内容'}
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {item.content}
            </div>
          </div>

          {/* 夢占い結果（夢の場合） */}
          {!isDiary && item.fortune_result && (
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                夢占い結果
              </p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-purple-900 dark:text-purple-100">
                {item.fortune_result}
              </div>
            </div>
          )}

          {/* 編集ボタン */}
          <div className="pt-4 border-t">
            <Button onClick={handleEdit} variant="outline" className="w-full">
              <Edit2 className="w-4 h-4 mr-2" />
              編集する
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
