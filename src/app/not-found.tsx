import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-md w-full text-center space-y-6">
        <FileQuestion className="w-16 h-16 mx-auto text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">ページが見つかりません</h1>
          <p className="text-muted-foreground mt-2">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>
        <div className="space-y-3">
          <Link href="/app/home">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              トップページへ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
