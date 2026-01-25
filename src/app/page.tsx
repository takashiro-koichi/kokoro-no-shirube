import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-4xl font-bold text-primary">こころのしるべ</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          心の道標となる日記・夢記録・ウィッシュリスト管理サービス
        </p>
        <p className="text-sm text-muted-foreground">LP（Phase 7で実装予定）</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button>ログイン</Button>
          </Link>
          <Link href="/app/home">
            <Button variant="outline">アプリを見る（開発用）</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
