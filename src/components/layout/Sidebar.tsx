'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, Moon, Home, Calendar, FileText, Star, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app/home', icon: Home, label: 'ホーム' },
  { href: '/app/diary', icon: PenLine, label: '日記' },
  { href: '/app/dream', icon: Moon, label: '夢記録' },
  { href: '/app/calendar', icon: Calendar, label: 'カレンダー' },
  { href: '/app/timeline', icon: FileText, label: 'タイムライン' },
  { href: '/app/wishlist', icon: Star, label: 'ウィッシュリスト' },
  { href: '/app/stats', icon: BarChart3, label: '統計' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-60 bg-white/80 backdrop-blur-sm border-r hidden md:block z-40">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
