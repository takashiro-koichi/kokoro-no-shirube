'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-sm border-b z-50">
      <div className="flex items-center justify-between h-full px-4">
        <Link href="/app/home" className="text-xl font-bold text-primary">
          こころのしるべ
        </Link>
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
