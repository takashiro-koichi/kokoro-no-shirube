'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mic, Moon, LogOut, ChevronRight, BookUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const settingsItems = [
  {
    href: '/app/settings/profile',
    icon: User,
    label: 'プロフィール',
    description: 'ニックネーム、生年月日',
  },
  {
    href: '/app/settings/recording',
    icon: Mic,
    label: '記録設定',
    description: '音声AI変換レベル',
  },
  {
    href: '/app/settings/fortune',
    icon: Moon,
    label: '夢占い設定',
    description: '夢占いモード選択',
  },
  {
    href: '/app/settings/glossary',
    icon: BookUser,
    label: '固有名詞',
    description: '夢占いの精度向上に活用',
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/auth/signout');
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="space-y-2">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center p-4">
                <item.icon className="w-5 h-5 text-primary mr-4" />
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
