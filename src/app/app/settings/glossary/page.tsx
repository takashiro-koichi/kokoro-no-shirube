'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  getUserGlossary,
  createGlossaryItem,
  updateGlossaryItem,
  deleteGlossaryItem,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserGlossary } from '@/lib/supabase/types';

export default function GlossaryPage() {
  const { user } = useAuth();
  const [glossary, setGlossary] = useState<UserGlossary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 新規追加用
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 編集用
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 削除中のID
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGlossary = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const data = await getUserGlossary(supabase, user.id);
      setGlossary(data);
    } catch (err) {
      console.error('Failed to load glossary:', err);
      setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGlossary();
  }, [loadGlossary]);

  // 新規追加
  const handleAdd = async () => {
    if (!user || !newName.trim() || !newDescription.trim()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const item = await createGlossaryItem(supabase, {
        user_id: user.id,
        name: newName.trim(),
        description: newDescription.trim(),
      });
      setGlossary((prev) => [item, ...prev]);
      setNewName('');
      setNewDescription('');
      setIsAdding(false);
      setSuccess('追加しました');
    } catch (err) {
      console.error('Failed to add glossary item:', err);
      setError('追加に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 編集開始
  const startEditing = (item: UserGlossary) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description);
  };

  // 編集キャンセル
  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  // 編集保存
  const handleUpdate = async () => {
    if (!editingId || !editName.trim() || !editDescription.trim()) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const updated = await updateGlossaryItem(supabase, editingId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setGlossary((prev) =>
        prev.map((item) => (item.id === editingId ? updated : item))
      );
      setEditingId(null);
      setSuccess('更新しました');
    } catch (err) {
      console.error('Failed to update glossary item:', err);
      setError('更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この項目を削除しますか？')) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      await deleteGlossaryItem(supabase, id);
      setGlossary((prev) => prev.filter((item) => item.id !== id));
      setSuccess('削除しました');
    } catch (err) {
      console.error('Failed to delete glossary item:', err);
      setError('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">固有名詞</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        夢に登場する人物や場所などを登録すると、夢占いの精度が向上します。
      </p>

      {/* メッセージ */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      {/* 新規追加フォーム */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新規追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                placeholder="例：田中さん、実家"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                placeholder="例：大学時代の友人、子供の頃に住んでいた家"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                  setNewDescription('');
                }}
                disabled={isSaving}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  isSaving || !newName.trim() || !newDescription.trim()
                }
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                追加
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          新しい項目を追加
        </Button>
      )}

      {/* 一覧 */}
      <div className="space-y-2">
        {glossary.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            まだ登録されていません
          </p>
        ) : (
          glossary.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                {editingId === item.id ? (
                  // 編集モード
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={isUpdating}
                      placeholder="名前"
                    />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      disabled={isUpdating}
                      rows={2}
                      placeholder="説明"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isUpdating}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        disabled={
                          isUpdating ||
                          !editName.trim() ||
                          !editDescription.trim()
                        }
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(item)}
                        disabled={deletingId === item.id}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
