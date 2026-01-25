'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-orange-500" />
          <div>
            <h2 className="text-xl font-bold">エラーが発生しました</h2>
            <p className="text-muted-foreground mt-2">
              申し訳ありません。予期せぬエラーが発生しました。
            </p>
          </div>
          <Button onClick={reset} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
