'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AccountPage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const CONFIRM_WORD = '削除する';

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_WORD) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Deletion failed');
      }

      // ログインページへリダイレクト
      router.push('/login?deleted=true');
    } catch (error) {
      console.error('Account deletion error:', error);
      alert('アカウントの削除に失敗しました');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">アカウント設定</h1>
        <p className="text-muted-foreground mt-1">
          アカウントに関する設定を行います
        </p>
      </div>

      <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            危険な操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-red-600">アカウント削除</h3>
            <p className="text-sm text-muted-foreground mt-1">
              アカウントを削除すると、すべてのデータ（日記、夢記録、ウィッシュリストなど）が完全に削除され、復元できません。
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowDialog(true)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            アカウントを削除
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              アカウントを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  この操作は取り消せません。すべてのデータが完全に削除されます：
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>日記の記録</li>
                  <li>夢の記録と占い結果</li>
                  <li>ウィッシュリスト</li>
                  <li>設定とプロフィール</li>
                </ul>
                <div className="pt-2">
                  <Label htmlFor="confirm" className="text-sm font-medium">
                    確認のため「{CONFIRM_WORD}」と入力してください
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={CONFIRM_WORD}
                    className="mt-2"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                '削除する'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
