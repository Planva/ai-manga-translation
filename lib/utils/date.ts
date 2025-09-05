// lib/utils/date.ts
export type UiDate = { iso: string; display: string };

/**
 * 任何未知输入 => 安全地格式化为 UI 文本
 * - 支持 string | Date | number
 * - 非法输入直接返回 null，不渲染
 */
export function formatDateForUI(input: unknown, locale = 'en-US'): UiDate | null {
  let d: Date | null = null;

  if (input instanceof Date) {
    d = input;
  } else if (typeof input === 'string' || typeof input === 'number') {
    const t = new Date(input);
    d = Number.isNaN(t.getTime()) ? null : t;
  }

  if (!d) return null;

  // ISO 用于 time 元素的 dateTime，display 用于给人读
  const iso = d.toISOString();
  const display = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);

  return { iso, display };
}
