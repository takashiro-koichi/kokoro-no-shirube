'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { CalendarDayData } from '@/lib/supabase/types';

interface CalendarProps {
  year: number;
  month: number;
  data: CalendarDayData[];
  onDayClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function Calendar({
  year,
  month,
  data,
  onDayClick,
  onMonthChange,
}: CalendarProps) {
  const isMobile = useIsMobile();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // データをマップに変換
  const dataMap = new Map(data.map((d) => [d.date, d]));

  // 月の日数と開始曜日を計算
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  // 前月・次月への移動
  const goToPrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  // カレンダーグリッドを生成
  const calendarDays: (number | null)[] = [];

  // 月初の空白
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // 日付
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // 日付からデータを取得
  const getDayData = (day: number): CalendarDayData | undefined => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dataMap.get(dateStr);
  };

  // セルのコンテンツを生成
  const renderDayContent = (day: number) => {
    const dayData = getDayData(day);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    const icons: string[] = [];
    if (dayData?.hasDiary) {
      if (dayData.emotionEmoji) {
        icons.push(dayData.emotionEmoji);
      } else {
        icons.push('●');
      }
    }
    if (dayData?.hasDream) {
      icons.push('🌙');
    }
    if (dayData?.hasAchievement) {
      icons.push('🎉');
    }

    const hasContent = icons.length > 0;
    const tooltipContent = dayData ? (
      <div className="space-y-1 text-xs">
        {dayData.hasDiary && (
          <div>
            <span className="font-medium">日記</span>
            {dayData.diarySummary && (
              <p className="text-muted-foreground">{dayData.diarySummary}</p>
            )}
          </div>
        )}
        {dayData.hasDream && (
          <div>
            <span className="font-medium">夢記録</span>
            {dayData.dreamKeywords && dayData.dreamKeywords.length > 0 && (
              <p className="text-muted-foreground">
                {dayData.dreamKeywords.join(', ')}
              </p>
            )}
          </div>
        )}
        {dayData.hasAchievement && (
          <div className="text-green-600">ウィッシュ達成!</div>
        )}
      </div>
    ) : null;

    const cellContent = (
      <button
        onClick={() => hasContent && onDayClick(dateStr)}
        className={`
          w-full h-full min-h-[60px] flex flex-col items-center justify-start pt-1 rounded-md transition-colors
          ${hasContent ? 'hover:bg-accent cursor-pointer' : 'cursor-default'}
          ${isToday ? 'bg-primary/10 font-bold' : ''}
        `}
        disabled={!hasContent}
      >
        <span className={`text-sm ${isToday ? 'text-primary' : ''}`}>{day}</span>
        {icons.length > 0 && (
          <div className="flex flex-wrap justify-center gap-0.5 mt-1 text-xs">
            {icons.map((icon, i) => (
              <span key={i}>{icon}</span>
            ))}
          </div>
        )}
      </button>
    );

    if (!hasContent) {
      return cellContent;
    }

    // PC: Tooltip, スマホ: Popover
    if (isMobile) {
      return (
        <Popover
          open={openPopover === dateStr}
          onOpenChange={(open) => setOpenPopover(open ? dateStr : null)}
        >
          <PopoverTrigger asChild>{cellContent}</PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="font-medium">
                {month}月{day}日
              </p>
              {tooltipContent}
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  onDayClick(dateStr);
                  setOpenPopover(null);
                }}
              >
                詳細を見る
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full">
      {/* ヘッダー: 月切り替え */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {year}年{month}月
        </h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`
              text-center text-sm font-medium py-2
              ${i === 0 ? 'text-red-500' : ''}
              ${i === 6 ? 'text-blue-500' : ''}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              border rounded-md min-h-[60px]
              ${day === null ? 'bg-muted/30' : 'bg-card'}
            `}
          >
            {day !== null && renderDayContent(day)}
          </div>
        ))}
      </div>
    </div>
  );
}
