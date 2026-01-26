/**
 * 日付ユーティリティ関数
 */

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * Date を 'YYYY-MM-DD' 形式の文字列に変換
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Date を表示用にフォーマット（例: '2025年1月15日(水)'）
 */
export function formatDisplayDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  return `${year}年${month}月${day}日(${dayOfWeek})`;
}

/**
 * 'YYYY-MM-DD' 形式の文字列を表示用にフォーマット（例: '2025年1月15日(水)'）
 */
export function formatDisplayDateFromString(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return formatDisplayDate(date);
}

/**
 * Date を短い表示用にフォーマット（例: '1月15日(水)'）- 年なし
 */
export function formatShortDisplayDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  return `${month}月${day}日(${dayOfWeek})`;
}

/**
 * 'YYYY-MM-DD' 形式の文字列をコンパクト表示用にフォーマット（例: '1/15（水）'）
 */
export function formatCompactDateFromString(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  return `${month}/${day}（${dayOfWeek}）`;
}

/**
 * 今日の日付を 'YYYY-MM-DD' 形式で取得
 */
export function getTodayString(): string {
  return toDateString(new Date());
}
