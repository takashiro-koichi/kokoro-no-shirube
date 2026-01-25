'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  getUserAttributes,
  getUserProfile,
  upsertUserAttribute,
  calculateAge,
  updateWishlistStatuses,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ATTRIBUTE_DEFINITIONS,
  ATTRIBUTE_CATEGORIES,
  getAttributesByCategory,
  type AttributeCategory,
  type AttributeDefinition,
} from '@/lib/constants/attributes';

export default function AttributesPage() {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [userAge, setUserAge] = useState<number | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // ユーザープロフィールから生年月日を取得
      const profile = await getUserProfile(supabase, user.id);
      if (profile?.birth_date) {
        setBirthDate(profile.birth_date);
        setUserAge(calculateAge(profile.birth_date));
      }

      // 属性を取得
      const data = await getUserAttributes(supabase, user.id);
      const attrMap = new Map(data.map((a) => [a.attribute_key, a]));

      // 値を初期化
      const initialValues: Record<string, string> = {};
      ATTRIBUTE_DEFINITIONS.forEach((def) => {
        if (def.isCalculated) return;
        const attr = attrMap.get(def.key);
        if (def.valueType === 'number') {
          initialValues[def.key] =
            attr?.attribute_value !== null && attr?.attribute_value !== undefined
              ? String(attr.attribute_value)
              : '';
        } else if (def.valueType === 'text') {
          initialValues[def.key] = attr?.text_value || '';
        } else if (def.valueType === 'boolean') {
          initialValues[def.key] = attr?.boolean_value ? 'true' : 'false';
        }
      });
      setValues(initialValues);
    } catch (err) {
      console.error('Failed to load attributes:', err);
      setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleValueChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user || !birthDate) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // 各属性を保存
      for (const def of ATTRIBUTE_DEFINITIONS) {
        if (def.isCalculated) continue;

        const value = values[def.key];
        if (!value && value !== '0') continue;

        const data: {
          user_id: string;
          attribute_key: string;
          attribute_value?: number | null;
          text_value?: string | null;
          boolean_value?: boolean | null;
        } = {
          user_id: user.id,
          attribute_key: def.key,
        };

        if (def.valueType === 'number') {
          data.attribute_value = Number(value);
        } else if (def.valueType === 'text') {
          data.text_value = value;
        } else if (def.valueType === 'boolean') {
          data.boolean_value = value === 'true';
        }

        await upsertUserAttribute(supabase, data);
      }

      // ウィッシュリストのステータスを再評価
      await updateWishlistStatuses(supabase, user.id, birthDate);

      setSuccess('保存しました');
    } catch (err) {
      console.error('Failed to save attributes:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAttributeInput = (def: AttributeDefinition) => {
    if (def.isCalculated) {
      // 年齢は自動計算
      return (
        <div className="flex items-center gap-2">
          <Input
            value={userAge !== null ? String(userAge) : ''}
            disabled
            className="w-24 bg-muted"
          />
          <span className="text-sm text-muted-foreground">{def.unit}</span>
          <span className="text-xs text-muted-foreground">（自動計算）</span>
        </div>
      );
    }

    if (def.valueType === 'number') {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={values[def.key] || ''}
            onChange={(e) => handleValueChange(def.key, e.target.value)}
            disabled={isSaving}
            className="w-32"
          />
          {def.unit && (
            <span className="text-sm text-muted-foreground">{def.unit}</span>
          )}
        </div>
      );
    }

    if (def.valueType === 'text') {
      return (
        <Input
          value={values[def.key] || ''}
          onChange={(e) => handleValueChange(def.key, e.target.value)}
          disabled={isSaving}
          className="max-w-xs"
        />
      );
    }

    if (def.valueType === 'boolean') {
      return (
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={def.key}
              value="true"
              checked={values[def.key] === 'true'}
              onChange={(e) => handleValueChange(def.key, e.target.value)}
              disabled={isSaving}
            />
            はい
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={def.key}
              value="false"
              checked={values[def.key] === 'false' || !values[def.key]}
              onChange={(e) => handleValueChange(def.key, e.target.value)}
              disabled={isSaving}
            />
            いいえ
          </label>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories: AttributeCategory[] = [
    'financial',
    'life_stage',
    'health',
    'relationship',
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">条件用属性</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        ウィッシュリストの実施可能条件の判定に使用されます。
      </p>

      {/* メッセージ */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      {/* カテゴリ別の属性 */}
      {categories.map((category) => {
        const attrs = getAttributesByCategory(category);
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">
                {ATTRIBUTE_CATEGORIES[category]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attrs.map((def) => (
                <div key={def.key} className="flex items-center justify-between">
                  <Label className="font-normal">{def.label}</Label>
                  {renderAttributeInput(def)}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* 保存ボタン */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        保存
      </Button>
    </div>
  );
}
