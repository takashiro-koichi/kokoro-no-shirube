import type { AttributeKey } from '@/lib/supabase/types';

// 属性カテゴリ
export type AttributeCategory =
  | 'financial'
  | 'life_stage'
  | 'health'
  | 'relationship';

// 属性の値タイプ
export type AttributeValueType = 'number' | 'text' | 'boolean';

// 属性の定義情報
export interface AttributeDefinition {
  key: AttributeKey;
  label: string;
  category: AttributeCategory;
  valueType: AttributeValueType;
  unit?: string;
  isCalculated?: boolean;
}

export const ATTRIBUTE_CATEGORIES: Record<AttributeCategory, string> = {
  financial: '金銭・資産系',
  life_stage: '時間・ライフステージ系',
  health: '健康・自己投資系',
  relationship: '人間関係・状況系',
};

export const ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
  // 金銭・資産系
  {
    key: 'annual_income',
    label: '年収',
    category: 'financial',
    valueType: 'number',
    unit: '万円',
  },
  {
    key: 'savings',
    label: '貯金額',
    category: 'financial',
    valueType: 'number',
    unit: '万円',
  },
  {
    key: 'investment_assets',
    label: '投資資産額',
    category: 'financial',
    valueType: 'number',
    unit: '万円',
  },
  {
    key: 'monthly_disposable',
    label: '月の可処分所得',
    category: 'financial',
    valueType: 'number',
    unit: '万円',
  },
  {
    key: 'debt_balance',
    label: '借金・ローン残高',
    category: 'financial',
    valueType: 'number',
    unit: '万円',
  },

  // 時間・ライフステージ系
  {
    key: 'age',
    label: '年齢',
    category: 'life_stage',
    valueType: 'number',
    unit: '歳',
    isCalculated: true,
  },
  {
    key: 'child_age',
    label: '子供の年齢',
    category: 'life_stage',
    valueType: 'number',
    unit: '歳',
  },
  {
    key: 'years_employed',
    label: '勤続年数',
    category: 'life_stage',
    valueType: 'number',
    unit: '年',
  },
  {
    key: 'paid_leave_remaining',
    label: '有給残日数',
    category: 'life_stage',
    valueType: 'number',
    unit: '日',
  },
  {
    key: 'retired',
    label: '退職フラグ',
    category: 'life_stage',
    valueType: 'boolean',
  },

  // 健康・自己投資系
  {
    key: 'weight',
    label: '体重',
    category: 'health',
    valueType: 'number',
    unit: 'kg',
  },
  {
    key: 'certification',
    label: '資格取得状況',
    category: 'health',
    valueType: 'text',
  },

  // 人間関係・状況系
  {
    key: 'has_partner',
    label: '配偶者/パートナー有無',
    category: 'relationship',
    valueType: 'boolean',
  },
  {
    key: 'residence',
    label: '居住地',
    category: 'relationship',
    valueType: 'text',
  },
  {
    key: 'job_title',
    label: '役職',
    category: 'relationship',
    valueType: 'text',
  },
];

export const COMPARISON_OPERATORS: Record<string, string> = {
  gte: '以上',
  lte: '以下',
  eq: '等しい',
};

// 属性キーから定義を取得
export function getAttributeDefinition(
  key: string
): AttributeDefinition | undefined {
  return ATTRIBUTE_DEFINITIONS.find((def) => def.key === key);
}

// 条件設定に使用可能な属性（数値型のみ）
export function getConditionableAttributes(): AttributeDefinition[] {
  return ATTRIBUTE_DEFINITIONS.filter((def) => def.valueType === 'number');
}

// カテゴリ別に属性を取得
export function getAttributesByCategory(
  category: AttributeCategory
): AttributeDefinition[] {
  return ATTRIBUTE_DEFINITIONS.filter((def) => def.category === category);
}
