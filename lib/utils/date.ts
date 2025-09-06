// lib/utils/date.ts
export type UiDate = { iso: string; display: string };

export function formatDateForUI(input: unknown, locale = 'en-US'): UiDate | null {
  let d: Date | null = null;
  if (input instanceof Date) d = input;
  else if (typeof input === 'string' || typeof input === 'number') {
    const t = new Date(input);
    d = Number.isNaN(t.getTime()) ? null : t;
  }
  if (!d) return null;
  return {
    iso: d.toISOString(),
    display: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
  };
}
