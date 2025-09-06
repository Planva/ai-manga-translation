// lib/limits/quota.ts
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm';

export const DAILY_FREE_LIMIT = 10;
const COOKIE_NAME = 'fqk';

// === helpers ===
function today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// 绝不抛错，始终返回字符串
function safeHeader(req: NextRequest, name: string) {
  try { return req.headers?.get?.(name) || ''; } catch { return ''; }
}
function safeCookie(req: NextRequest, name: string) {
  try {
    const c: any = (req as any).cookies;
    if (!c || typeof c.get !== 'function') return '';
    const got = c.get(name);
    return (typeof got === 'string' ? got : got?.value) || '';
  } catch { return ''; }
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
  return `${ip}|${ua}|${lang}|${accept}`; // 不用 Object.entries
}

// === identity ===
export async function getAnonKey(req: NextRequest) {
  const ck = safeCookie(req, COOKIE_NAME);
  const fp = ck || getFingerprint(req);
  const key = fp || 'anon|' + (ipFromReq(req) || '0.0.0.0'); // 兜底，保证非空
  return { keyType: 'fp' as const, key };
}

// === read-only ===
export async function getDailyRemaining(req: NextRequest, limit = DAILY_FREE_LIMIT) {
  
  const { keyType, key } = await getAnonKey(req);
  const d = today();

  // 走原生 SQL，绕开 drizzle 的 orderSelectedFields
  const r: any = await db.execute(
    sql`select uses from free_quota where date = ${d} and key_type = ${keyType} and key = ${key} limit 1`
  );

  // node-postgres 驱动：结果在 rows
  const used = r?.rows?.[0]?.uses ?? 0;
  const isPaid = false; // 付费接入后再置 true

  return { limit, used, remaining: Math.max(0, limit - used), isPaid };
}

// === consume on success ===
export async function consumeUnits(req: NextRequest, amount: number) {
  
  const { keyType, key } = await getAnonKey(req);
  const d = today();

  // upsert 也改成 SQL，最稳
  await db.execute(sql`
    insert into free_quota (date, key_type, key, uses)
    values (${d}, ${keyType}, ${key}, ${amount})
    on conflict (date, key_type, key)
    do update set uses = free_quota.uses + ${amount}
  `);

  return getDailyRemaining(req);
}
