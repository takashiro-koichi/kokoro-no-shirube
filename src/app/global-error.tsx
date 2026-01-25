'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-orange-50 to-white">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertTriangle className="w-16 h-16 mx-auto text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold">エラーが発生しました</h1>
              <p className="text-gray-600 mt-2">
                申し訳ありません。予期せぬエラーが発生しました。
              </p>
              {error.digest && (
                <p className="text-xs text-gray-400 mt-2">
                  エラーID: {error.digest}
                </p>
              )}
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
