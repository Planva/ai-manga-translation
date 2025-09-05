// lib/limits/quota.ts
import type { NextRequest } from 'next/server';

export const DAILY_FREE_LIMIT = 10;
const COOKIE_NAME = 'fqk';

// —— 按需获取 Supabase Admin 客户端（带缓存，见 lib/db/supabase.ts）——
async function getDb() {
  const { getSupabaseAdmin } = await import('@/lib/db/supabase');
  return getSupabaseAdmin();
}

// === helpers ===
function today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
}

function safeHeader(req: NextRequest, name: string) {
  try {
    return req.headers?.get?.(name) || '';
  } catch {
    return '';
  }
}
function safeCookie(req: NextRequest, name: string) {
  try {
    const c: any = (req as any).cookies;
    if (!c || typeof c.get !== 'function') return '';
    const got = c.get(name);
    return (typeof got === 'string' ? got : got?.value) || '';
  } catch {
    return '';
  }
}
function ipFromReq(req: NextRequest) {
  const v =
    safeHeader(req, 'x-forwarded-for') ||
    safeHeader(req, 'cf-connecting-ip') ||
    safeHeader(req, 'x-real-ip');
  return (v.split(',')[0] || '').trim();
}
function getFingerprint(req: NextRequest) {
  const ip = ipFromReq(req) || '0.0.0.0';
  const ua = safeHeader(req, 'user-agent');
  const lang = safeHeader(req, 'accept-language');
  const accept = safeHeader(req, 'accept');
  return `${ip}|${ua}|${lang}|${accept}`;
}

// === identity ===
export async function getAnonKey(req: NextRequest) {
  const ck = safeCookie(req, COOKIE_NAME);
  const fp = ck || getFingerprint(req);
  const key = fp || 'anon|' + (ipFromReq(req) || '0.0.0.0');
  return { keyType: 'fp' as const, key };
}

// === read-only ===
export async function getDailyRemaining(req: NextRequest, limit = DAILY_FREE_LIMIT) {
  const supabase = await getDb();
  const { keyType, key } = await getAnonKey(req);
  const d = today();

  const { data, error } = await supabase
    .from('free_quota')
    .select('uses')
    .eq('date', d)
    .eq('key_type', keyType)
    .eq('key', key)
    .maybeSingle();

  const used = !error ? (data?.uses ?? 0) : 0;
  const isPaid = false;

  return { limit, used, remaining: Math.max(0, limit - used), isPaid };
}

// === consume on success ===
export async function consumeUnits(req: NextRequest, amount: number) {
  const supabase = await getDb();
  const { keyType, key } = await getAnonKey(req);
  const d = today();

  // 读旧值
  const { data: row } = await supabase
    .from('free_quota')
    .select('uses')
    .eq('date', d)
    .eq('key_type', keyType)
    .eq('key', key)
    .maybeSingle();

  const newUses = (row?.uses ?? 0) + (Number(amount) || 1);

  // upsert 覆盖
  await supabase
    .from('free_quota')
    .upsert({ date: d, key_type: keyType, key, uses: newUses }, { onConflict: 'date,key_type,key' });

  return getDailyRemaining(req);
}
