'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, Moon, Home, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app/diary', icon: PenLine, label: '日記' },
  { href: '/app/dream', icon: Moon, label: '夢' },
  { href: '/app/home', icon: Home, label: 'ホーム', isCenter: true },
  { href: '/app/wishlist', icon: Star, label: '願い' },
  { href: '/app/calendar', icon: Calendar, label: '振り返り' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-t md:hidden z-50">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/app/calendar' && pathname === '/app/timeline');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-full',
                'transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-6 w-6', item.isCenter && 'h-7 w-7')} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
