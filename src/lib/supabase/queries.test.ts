import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateAge,
  evaluateCondition,
  evaluateWishlistConditions,
} from './queries';
import type { Wishlist, UserAttribute } from './types';

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('誕生日前なら1歳若く計算される', () => {
    vi.setSystemTime(new Date('2025-06-15'));
    expect(calculateAge('1990-12-01')).toBe(34);
  });

  it('誕生日後なら正確な年齢が計算される', () => {
    vi.setSystemTime(new Date('2025-06-15'));
    expect(calculateAge('1990-01-15')).toBe(35);
  });

  it('誕生日当日は歳をとっている', () => {
    vi.setSystemTime(new Date('2025-06-15'));
    expect(calculateAge('1990-06-15')).toBe(35);
  });

  it('誕生日の前日はまだ歳をとっていない', () => {
    vi.setSystemTime(new Date('2025-06-14'));
    expect(calculateAge('1990-06-15')).toBe(34);
  });

  it('うるう年の誕生日も正しく計算される', () => {
    vi.setSystemTime(new Date('2025-02-28'));
    expect(calculateAge('1992-02-29')).toBe(32); // 2/29生まれだが、2/28ではまだ
  });

  it('年始の誕生日', () => {
    vi.setSystemTime(new Date('2025-01-02'));
    expect(calculateAge('1990-01-01')).toBe(35);
  });

  it('年末の誕生日', () => {
    vi.setSystemTime(new Date('2025-12-30'));
    expect(calculateAge('1990-12-31')).toBe(34);
  });
});

describe('evaluateCondition', () => {
  describe('gte (以上)', () => {
    it('値が条件値以上ならtrue', () => {
      expect(evaluateCondition(500, 'gte', 400)).toBe(true);
    });

    it('値が条件値と等しければtrue', () => {
      expect(evaluateCondition(400, 'gte', 400)).toBe(true);
    });

    it('値が条件値未満ならfalse', () => {
      expect(evaluateCondition(300, 'gte', 400)).toBe(false);
    });
  });

  describe('lte (以下)', () => {
    it('値が条件値以下ならtrue', () => {
      expect(evaluateCondition(300, 'lte', 400)).toBe(true);
    });

    it('値が条件値と等しければtrue', () => {
      expect(evaluateCondition(400, 'lte', 400)).toBe(true);
    });

    it('値が条件値より大きければfalse', () => {
      expect(evaluateCondition(500, 'lte', 400)).toBe(false);
    });
  });

  describe('eq (等しい)', () => {
    it('値が条件値と等しければtrue', () => {
      expect(evaluateCondition(400, 'eq', 400)).toBe(true);
    });

    it('値が条件値と異なればfalse', () => {
      expect(evaluateCondition(401, 'eq', 400)).toBe(false);
    });
  });

  describe('null/undefined の扱い', () => {
    it('nullはfalse', () => {
      expect(evaluateCondition(null, 'gte', 400)).toBe(false);
    });

    it('undefinedはfalse', () => {
      expect(evaluateCondition(undefined, 'gte', 400)).toBe(false);
    });
  });

  describe('不明なオペレータ', () => {
    it('不明なオペレータはfalse', () => {
      expect(evaluateCondition(400, 'unknown', 400)).toBe(false);
    });
  });

  describe('境界値', () => {
    it('0の比較', () => {
      expect(evaluateCondition(0, 'gte', 0)).toBe(true);
      expect(evaluateCondition(0, 'lte', 0)).toBe(true);
      expect(evaluateCondition(0, 'eq', 0)).toBe(true);
    });

    it('負の数の比較', () => {
      expect(evaluateCondition(-100, 'gte', -200)).toBe(true);
      expect(evaluateCondition(-100, 'lte', 0)).toBe(true);
    });
  });
});

describe('evaluateWishlistConditions', () => {
  // テスト用ウィッシュリストを作成するヘルパー
  const createWishlist = (overrides: Partial<Wishlist> = {}): Wishlist => ({
    id: 'wish-1',
    user_id: 'user-1',
    title: 'Test Wish',
    description: null,
    condition1_attribute: null,
    condition1_operator: null,
    condition1_value: null,
    condition2_attribute: null,
    condition2_operator: null,
    condition2_value: null,
    deadline: null,
    status: 'pending',
    achieved_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  });

  // テスト用属性を作成するヘルパー
  const createAttribute = (
    key: string,
    value: number
  ): [string, UserAttribute] => [
    key,
    {
      id: `attr-${key}`,
      user_id: 'user-1',
      attribute_key: key,
      attribute_value: value,
      text_value: null,
      boolean_value: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  describe('条件なし', () => {
    it('条件がない場合は常に achievable', () => {
      const wishlist = createWishlist();
      const result = evaluateWishlistConditions(wishlist, new Map(), 30);

      expect(result.condition1Met).toBe(false);
      expect(result.condition2Met).toBe(false);
      expect(result.isAchievable).toBe(true);
    });
  });

  describe('条件1のみ', () => {
    it('年齢条件を満たす場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 30,
      });

      const result = evaluateWishlistConditions(wishlist, new Map(), 35);

      expect(result.condition1Met).toBe(true);
      expect(result.isAchievable).toBe(true);
    });

    it('年齢条件を満たさない場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 40,
      });

      const result = evaluateWishlistConditions(wishlist, new Map(), 35);

      expect(result.condition1Met).toBe(false);
      expect(result.isAchievable).toBe(false);
    });

    it('属性条件を満たす場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'annual_income',
        condition1_operator: 'gte',
        condition1_value: 5000000,
      });

      const attributesMap = new Map([
        createAttribute('annual_income', 6000000),
      ]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 30);

      expect(result.condition1Met).toBe(true);
      expect(result.isAchievable).toBe(true);
    });

    it('属性条件を満たさない場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'annual_income',
        condition1_operator: 'gte',
        condition1_value: 5000000,
      });

      const attributesMap = new Map([
        createAttribute('annual_income', 4000000),
      ]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 30);

      expect(result.condition1Met).toBe(false);
      expect(result.isAchievable).toBe(false);
    });

    it('属性が存在しない場合は条件を満たさない', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'annual_income',
        condition1_operator: 'gte',
        condition1_value: 5000000,
      });

      const result = evaluateWishlistConditions(wishlist, new Map(), 30);

      expect(result.condition1Met).toBe(false);
      expect(result.isAchievable).toBe(false);
    });
  });

  describe('条件2のみ', () => {
    it('条件2を満たす場合', () => {
      const wishlist = createWishlist({
        condition2_attribute: 'savings',
        condition2_operator: 'gte',
        condition2_value: 1000000,
      });

      const attributesMap = new Map([createAttribute('savings', 2000000)]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 30);

      expect(result.condition2Met).toBe(true);
      expect(result.isAchievable).toBe(true);
    });
  });

  describe('OR結合（条件1 OR 条件2）', () => {
    it('両方満たす場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 30,
        condition2_attribute: 'annual_income',
        condition2_operator: 'gte',
        condition2_value: 5000000,
      });

      const attributesMap = new Map([
        createAttribute('annual_income', 6000000),
      ]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 35);

      expect(result.condition1Met).toBe(true);
      expect(result.condition2Met).toBe(true);
      expect(result.isAchievable).toBe(true);
    });

    it('条件1のみ満たす場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 30,
        condition2_attribute: 'annual_income',
        condition2_operator: 'gte',
        condition2_value: 10000000,
      });

      const attributesMap = new Map([
        createAttribute('annual_income', 6000000),
      ]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 35);

      expect(result.condition1Met).toBe(true);
      expect(result.condition2Met).toBe(false);
      expect(result.isAchievable).toBe(true); // OR結合なので片方でOK
    });

    it('条件2のみ満たす場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 50,
        condition2_attribute: 'annual_income',
        condition2_operator: 'gte',
        condition2_value: 5000000,
      });

      const attributesMap = new Map([
        createAttribute('annual_income', 6000000),
      ]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 35);

      expect(result.condition1Met).toBe(false);
      expect(result.condition2Met).toBe(true);
      expect(result.isAchievable).toBe(true); // OR結合なので片方でOK
    });

    it('どちらも満たさない場合', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 50,
        condition2_attribute: 'annual_income',
        condition2_operator: 'gte',
        condition2_value: 10000000,
      });

      const attributesMap = new Map([
        createAttribute('annual_income', 6000000),
      ]);

      const result = evaluateWishlistConditions(wishlist, attributesMap, 35);

      expect(result.condition1Met).toBe(false);
      expect(result.condition2Met).toBe(false);
      expect(result.isAchievable).toBe(false);
    });
  });

  describe('lte オペレータ', () => {
    it('年齢が条件値以下の場合に達成可能', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'lte',
        condition1_value: 30,
      });

      const result = evaluateWishlistConditions(wishlist, new Map(), 25);

      expect(result.condition1Met).toBe(true);
      expect(result.isAchievable).toBe(true);
    });
  });

  describe('userAge が undefined の場合', () => {
    it('年齢条件は評価されない', () => {
      const wishlist = createWishlist({
        condition1_attribute: 'age',
        condition1_operator: 'gte',
        condition1_value: 30,
      });

      const result = evaluateWishlistConditions(wishlist, new Map());

      expect(result.condition1Met).toBe(false);
      expect(result.isAchievable).toBe(false);
    });
  });
});
