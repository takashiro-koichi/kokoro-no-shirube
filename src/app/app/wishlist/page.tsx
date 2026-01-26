'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Star,
  Check,
  Clock,
  Loader2,
  Trash2,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getWishlists,
  deleteWishlist,
  achieveWishlist,
  unachieveWishlist,
  getUserAttributesMap,
  getUserProfile,
  calculateAge,
  evaluateWishlistConditions,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  Wishlist,
  WishlistWithEvaluation,
  UserAttribute,
} from '@/lib/supabase/types';
import {
  ATTRIBUTE_DEFINITIONS,
  COMPARISON_OPERATORS,
} from '@/lib/constants/attributes';
import { WishlistFormDialog } from '@/components/wishlist/WishlistFormDialog';

const STATUS_CONFIG = {
  pending: {
    label: '未達成',
    variant: 'secondary' as const,
    icon: Clock,
  },
  achievable: {
    label: '達成可能',
    variant: 'default' as const,
    icon: Star,
  },
  achieved: {
    label: '達成済み',
    variant: 'outline' as const,
    icon: Check,
  },
};

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<WishlistWithEvaluation[]>([]);
  const [attributesMap, setAttributesMap] = useState<
    Map<string, UserAttribute>
  >(new Map());
  const [userAge, setUserAge] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ダイアログ制御
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [achievingId, setAchievingId] = useState<string | null>(null);
  const [unachievingId, setUnachievingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // ユーザープロフィールから生年月日を取得
      const profile = await getUserProfile(supabase, user.id);
      const age = profile?.birth_date
        ? calculateAge(profile.birth_date)
        : undefined;
      setUserAge(age);

      // 属性を取得
      const attrMap = await getUserAttributesMap(supabase, user.id);
      setAttributesMap(attrMap);

      // ウィッシュリストを取得
      const data = await getWishlists(supabase, user.id);

      // 条件評価を追加
      const withEvaluation = data.map((w) => {
        const { condition1Met, condition2Met } = evaluateWishlistConditions(
          w,
          attrMap,
          age
        );
        return {
          ...w,
          condition1_met: condition1Met,
          condition2_met: condition2Met,
        };
      });

      setWishlists(withEvaluation);
    } catch (err) {
      console.error('Failed to load wishlists:', err);
      setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 新規追加
  const handleAdd = () => {
    setEditingWishlist(null);
    setIsDialogOpen(true);
  };

  // 編集
  const handleEdit = (wishlist: Wishlist) => {
    setEditingWishlist(wishlist);
    setIsDialogOpen(true);
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('このウィッシュを削除しますか？')) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      await deleteWishlist(supabase, id);
      setWishlists((prev) => prev.filter((w) => w.id !== id));
      setSuccess('削除しました');
    } catch (err) {
      console.error('Failed to delete wishlist:', err);
      setError('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 達成
  const handleAchieve = async (id: string) => {
    if (!confirm('このウィッシュを達成済みにしますか？')) return;

    setAchievingId(id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const updated = await achieveWishlist(supabase, id);
      setWishlists((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updated } : w))
      );
      setSuccess('おめでとうございます！');
    } catch (err) {
      console.error('Failed to achieve wishlist:', err);
      setError('達成に失敗しました');
    } finally {
      setAchievingId(null);
    }
  };

  // 達成取り消し
  const handleUnachieve = async (id: string) => {
    if (!confirm('達成済みを取り消しますか？')) return;

    setUnachievingId(id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      // 条件を再評価して適切なステータスを決定
      const wishlist = wishlists.find((w) => w.id === id);
      if (!wishlist) return;

      const { isAchievable } = evaluateWishlistConditions(
        wishlist,
        attributesMap,
        userAge
      );
      const newStatus = isAchievable ? 'achievable' : 'pending';

      const updated = await unachieveWishlist(supabase, id, newStatus);
      const { condition1Met, condition2Met } = evaluateWishlistConditions(
        updated,
        attributesMap,
        userAge
      );

      setWishlists((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, ...updated, condition1_met: condition1Met, condition2_met: condition2Met }
            : w
        )
      );
      setSuccess('元に戻しました');
    } catch (err) {
      console.error('Failed to unachieve wishlist:', err);
      setError('取り消しに失敗しました');
    } finally {
      setUnachievingId(null);
    }
  };

  // 保存完了後
  const handleSaveComplete = (saved: Wishlist) => {
    const { condition1Met, condition2Met } = evaluateWishlistConditions(
      saved,
      attributesMap,
      userAge
    );
    const withEval = {
      ...saved,
      condition1_met: condition1Met,
      condition2_met: condition2Met,
    };

    if (editingWishlist) {
      setWishlists((prev) =>
        prev.map((w) => (w.id === saved.id ? withEval : w))
      );
    } else {
      setWishlists((prev) => [withEval, ...prev]);
    }
    setIsDialogOpen(false);
    setSuccess(editingWishlist ? '更新しました' : '追加しました');
  };

  // 条件の表示文字列を生成
  const formatCondition = (
    attribute: string | null,
    operator: string | null,
    value: number | null,
    isMet?: boolean
  ) => {
    if (!attribute || !operator || value === null) return null;

    const attrDef = ATTRIBUTE_DEFINITIONS.find((d) => d.key === attribute);
    const label = attrDef?.label || attribute;
    const unit = attrDef?.unit || '';
    const opLabel = COMPARISON_OPERATORS[operator] || operator;

    return (
      <span className={isMet ? 'text-green-600' : 'text-muted-foreground'}>
        {label} {opLabel} {value}
        {unit}
        {isMet && ' ✓'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ステータス別に分類
  const achievedList = wishlists.filter((w) => w.status === 'achieved');
  const achievableList = wishlists.filter((w) => w.status === 'achievable');
  const pendingList = wishlists.filter((w) => w.status === 'pending');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ウィッシュリスト</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          追加
        </Button>
      </div>

      {/* メッセージ */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      {/* 達成可能 */}
      {achievableList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            達成可能 ({achievableList.length})
          </h2>
          {achievableList.map((wishlist) => (
            <WishlistCard
              key={wishlist.id}
              wishlist={wishlist}
              formatCondition={formatCondition}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAchieve={handleAchieve}
              onUnachieve={handleUnachieve}
              deletingId={deletingId}
              achievingId={achievingId}
              unachievingId={unachievingId}
            />
          ))}
        </section>
      )}

      {/* 未達成 */}
      {pendingList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            未達成 ({pendingList.length})
          </h2>
          {pendingList.map((wishlist) => (
            <WishlistCard
              key={wishlist.id}
              wishlist={wishlist}
              formatCondition={formatCondition}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAchieve={handleAchieve}
              onUnachieve={handleUnachieve}
              deletingId={deletingId}
              achievingId={achievingId}
              unachievingId={unachievingId}
            />
          ))}
        </section>
      )}

      {/* 達成済み */}
      {achievedList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            達成済み ({achievedList.length})
          </h2>
          {achievedList.map((wishlist) => (
            <WishlistCard
              key={wishlist.id}
              wishlist={wishlist}
              formatCondition={formatCondition}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAchieve={handleAchieve}
              onUnachieve={handleUnachieve}
              deletingId={deletingId}
              achievingId={achievingId}
              unachievingId={unachievingId}
            />
          ))}
        </section>
      )}

      {/* 空の状態 */}
      {wishlists.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          ウィッシュを追加して、目標を管理しましょう
        </p>
      )}

      {/* ダイアログ */}
      <WishlistFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        wishlist={editingWishlist}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}

// カードコンポーネント
function WishlistCard({
  wishlist,
  formatCondition,
  onEdit,
  onDelete,
  onAchieve,
  onUnachieve,
  deletingId,
  achievingId,
  unachievingId,
}: {
  wishlist: WishlistWithEvaluation;
  formatCondition: (
    attr: string | null,
    op: string | null,
    val: number | null,
    isMet?: boolean
  ) => React.ReactNode;
  onEdit: (w: Wishlist) => void;
  onDelete: (id: string) => void;
  onAchieve: (id: string) => void;
  onUnachieve: (id: string) => void;
  deletingId: string | null;
  achievingId: string | null;
  unachievingId: string | null;
}) {
  const status = STATUS_CONFIG[wishlist.status];
  const StatusIcon = status.icon;
  const isProcessing =
    deletingId === wishlist.id || achievingId === wishlist.id || unachievingId === wishlist.id;

  return (
    <Card>
      <CardContent className="p-3">
        {/* ヘッダー: タイトル + バッジ + アクションボタン */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-medium truncate">{wishlist.title}</h3>
            <Badge variant={status.variant} className="shrink-0">
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(wishlist)}
              disabled={isProcessing}
              title="編集"
              className="h-7 w-7 p-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            {wishlist.status === 'achieved' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUnachieve(wishlist.id)}
                disabled={isProcessing}
                title="元に戻す"
                className="h-7 w-7 p-0"
              >
                {unachievingId === wishlist.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAchieve(wishlist.id)}
                disabled={isProcessing}
                title="達成済みにする"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
              >
                {achievingId === wishlist.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(wishlist.id)}
              disabled={isProcessing}
              title="削除"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            >
              {deletingId === wishlist.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* サブ情報: 条件・期限（コンパクト表示） */}
        {(wishlist.condition1_attribute || wishlist.deadline || wishlist.achieved_at) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            {wishlist.condition1_attribute && (
              <span>
                {formatCondition(
                  wishlist.condition1_attribute,
                  wishlist.condition1_operator,
                  wishlist.condition1_value,
                  wishlist.condition1_met
                )}
              </span>
            )}
            {wishlist.condition2_attribute && (
              <span>
                {formatCondition(
                  wishlist.condition2_attribute,
                  wishlist.condition2_operator,
                  wishlist.condition2_value,
                  wishlist.condition2_met
                )}
              </span>
            )}
            {wishlist.deadline && (
              <span>期限: {new Date(wishlist.deadline).toLocaleDateString('ja-JP')}</span>
            )}
            {wishlist.achieved_at && (
              <span className="text-green-600">
                達成: {new Date(wishlist.achieved_at).toLocaleDateString('ja-JP')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
