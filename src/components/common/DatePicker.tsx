'use client';

import { useState } from 'react';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
  maxDate?: Date;
}

// 安全な日付変換（タイムゾーン問題を回避）
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function DatePicker({
  date,
  onDateChange,
  disabled,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className={cn(
            'text-xl font-bold hover:bg-accent',
            !date && 'text-muted-foreground'
          )}
        >
          {formatDisplayDate(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => (maxDate ? d > maxDate : false)}
          locale={ja}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
