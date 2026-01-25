'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface YearMonthNavigatorProps {
  availableMonths: Array<{ year: number; month: number }>;
  onJump: (year: number, month: number) => void;
}

export function YearMonthNavigator({
  availableMonths,
  onJump,
}: YearMonthNavigatorProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  // 年ごとにグループ化
  const yearGroups = new Map<number, number[]>();
  for (const { year, month } of availableMonths) {
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(month);
  }

  // 年の切り替え
  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  // 月をクリック
  const handleMonthClick = (year: number, month: number) => {
    onJump(year, month);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const navigatorContent = (
    <div className="space-y-2">
      {Array.from(yearGroups.entries())
        .sort(([a], [b]) => b - a)
        .map(([year, months]) => (
          <div key={year}>
            <button
              onClick={() => toggleYear(year)}
              className="flex items-center gap-2 w-full py-2 px-3 hover:bg-accent rounded-md transition-colors"
            >
              {expandedYears.has(year) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="font-medium">{year}年</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {months.length}ヶ月
              </span>
            </button>

            {expandedYears.has(year) && (
              <div className="ml-6 grid grid-cols-4 gap-1 py-2">
                {months.sort((a, b) => b - a).map((month) => (
                  <Button
                    key={month}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMonthClick(year, month)}
                    className="text-sm"
                  >
                    {month}月
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}

      {availableMonths.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          記録がありません
        </p>
      )}
    </div>
  );

  // スマホ: シートで表示
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Calendar className="w-5 h-5" />
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>年月を選択</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto py-4">{navigatorContent}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // PC: サイドバーとして表示
  return (
    <div className="w-48 bg-card border rounded-lg p-3 sticky top-4">
      <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        年月を選択
      </h3>
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {navigatorContent}
      </div>
    </div>
  );
}
