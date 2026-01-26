'use client';

import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createWishlist, updateWishlist } from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Wishlist } from '@/lib/supabase/types';
import {
  getConditionableAttributes,
  COMPARISON_OPERATORS,
} from '@/lib/constants/attributes';

interface WishlistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  onSaveComplete: (saved: Wishlist) => void;
}

const conditionableAttributes = getConditionableAttributes();

export function WishlistFormDialog({
  open,
  onOpenChange,
  wishlist,
  onSaveComplete,
}: WishlistFormDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition1Attribute, setCondition1Attribute] = useState<string>('none');
  const [condition1Operator, setCondition1Operator] = useState<string>('gte');
  const [condition1Value, setCondition1Value] = useState<string>('');
  const [condition2Attribute, setCondition2Attribute] = useState<string>('none');
  const [condition2Operator, setCondition2Operator] = useState<string>('gte');
  const [condition2Value, setCondition2Value] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ダイアログを開いた時に初期化
  useEffect(() => {
    if (open) {
      if (wishlist) {
        setTitle(wishlist.title);
        setDescription(wishlist.description || '');
        setCondition1Attribute(wishlist.condition1_attribute || 'none');
        setCondition1Operator(wishlist.condition1_operator || 'gte');
        setCondition1Value(
          wishlist.condition1_value !== null
            ? String(wishlist.condition1_value)
            : ''
        );
        setCondition2Attribute(wishlist.condition2_attribute || 'none');
        setCondition2Operator(wishlist.condition2_operator || 'gte');
        setCondition2Value(
          wishlist.condition2_value !== null
            ? String(wishlist.condition2_value)
            : ''
        );
        setDeadline(wishlist.deadline || '');
      } else {
        setTitle('');
        setDescription('');
        setCondition1Attribute('none');
        setCondition1Operator('gte');
        setCondition1Value('');
        setCondition2Attribute('none');
        setCondition2Operator('gte');
        setCondition2Value('');
        setDeadline('');
      }
      setError(null);
    }
  }, [open, wishlist]);

  const handleSave = async () => {
    if (!user || !title.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const cond1Valid = condition1Attribute && condition1Attribute !== 'none';
      const cond2Valid = condition2Attribute && condition2Attribute !== 'none';

      const data = {
        title: title.trim(),
        description: description.trim() || null,
        condition1_attribute: cond1Valid ? condition1Attribute : null,
        condition1_operator: cond1Valid ? condition1Operator : null,
        condition1_value: cond1Valid && condition1Value
          ? Number(condition1Value)
          : null,
        condition2_attribute: cond2Valid ? condition2Attribute : null,
        condition2_operator: cond2Valid ? condition2Operator : null,
        condition2_value: cond2Valid && condition2Value
          ? Number(condition2Value)
          : null,
        deadline: deadline || null,
      };

      let saved: Wishlist;
      if (wishlist) {
        saved = await updateWishlist(supabase, wishlist.id, data);
      } else {
        saved = await createWishlist(supabase, {
          user_id: user.id,
          ...data,
        });
      }

      onSaveComplete(saved);
    } catch (err) {
      console.error('Failed to save wishlist:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const getAttrUnit = (key: string) => {
    const attr = conditionableAttributes.find((a) => a.key === key);
    return attr?.unit || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            {wishlist ? 'ウィッシュを編集' : '新しいウィッシュ'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">
              タイトル <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="例：沖縄旅行に行く"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              placeholder="詳細な説明（任意）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={2}
            />
          </div>

          {/* 条件1 */}
          <div className="space-y-2">
            <Label>実施可能条件 1</Label>
            <div className="flex gap-2">
              <Select
                value={condition1Attribute}
                onValueChange={setCondition1Attribute}
                disabled={isSaving}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="属性を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {conditionableAttributes.map((attr) => (
                    <SelectItem key={attr.key} value={attr.key}>
                      {attr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {condition1Attribute && condition1Attribute !== 'none' && (
                <>
                  <Select
                    value={condition1Operator}
                    onValueChange={setCondition1Operator}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPARISON_OPERATORS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-24"
                      value={condition1Value}
                      onChange={(e) => setCondition1Value(e.target.value)}
                      disabled={isSaving}
                    />
                    <span className="text-sm text-muted-foreground">
                      {getAttrUnit(condition1Attribute)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 条件2（条件1が設定されている場合のみ表示） */}
          {condition1Attribute && condition1Attribute !== 'none' && (
            <div className="space-y-2">
              <Label>実施可能条件 2（OR）</Label>
              <div className="flex gap-2">
                <Select
                  value={condition2Attribute}
                  onValueChange={setCondition2Attribute}
                  disabled={isSaving}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="属性を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {conditionableAttributes.map((attr) => (
                      <SelectItem key={attr.key} value={attr.key}>
                        {attr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {condition2Attribute && condition2Attribute !== 'none' && (
                  <>
                    <Select
                      value={condition2Operator}
                      onValueChange={setCondition2Operator}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPARISON_OPERATORS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="w-24"
                        value={condition2Value}
                        onChange={(e) => setCondition2Value(e.target.value)}
                        disabled={isSaving}
                      />
                      <span className="text-sm text-muted-foreground">
                        {getAttrUnit(condition2Attribute)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 目標期限 */}
          <div className="space-y-2">
            <Label htmlFor="deadline">目標期限</Label>
            <div className="flex gap-2">
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isSaving}
                className="flex-1"
              />
              {deadline && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setDeadline('')}
                  disabled={isSaving}
                  title="期限をクリア"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* エラー */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {wishlist ? '更新' : '追加'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
