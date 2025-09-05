// lib/limits/freeQuota.ts
import { cookies, headers } from 'next/headers';

/**
 * 纯内存 + Cookie 的免费额度实现（Cloudflare 友好）
 * - 每日上限 limit（默认 10）
 * - 以 device-cookie + IP 作为键（降低羊毛）
 * - 应用重启会清空（开发/Cloudflare Pages 适用）
 */

type QuotaRecord = { date: string; used: number };
const memoryStore: Record<string, QuotaRecord> = {};

function todayStr() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getClientKey(): string {
  const c = cookies();
  let device = c.get('fqk')?.value;
  if (!device) {
    device = crypto.randomUUID();
    // 400 天持久，前端可读（用作“设备”）
    c.set('fqk', device, {
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 400,
    });
  }
  const h = headers();
  const ip =
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    '0.0.0.0';
  return `${device}|${ip}`;
}

/** 查询今日剩余额度（不自增） */
export async function getDailyRemaining(
  limit = 10
): Promise<{ limit: number; used: number; remaining: number; isPaid: boolean; key: string; source: 'memory' }> {
  const key = getClientKey();
  const date = todayStr();
  const rec = memoryStore[key];
  const used = (!rec || rec.date !== date) ? 0 : rec.used;
  const remaining = Math.max(0, limit - used);
  // 这里先固定非付费，后面你接入真实会员逻辑再改
  return { limit, used, remaining, isPaid: false, key, source: 'memory' };
}

/** 消耗额度（成功后调用） */
export async function consumeUnits(
  amount = 1,
  limit = 10
): Promise<{ limit: number; used: number; remaining: number; isPaid: boolean; key: string; source: 'memory' }> {
  const key = getClientKey();
  const date = todayStr();
  const amt = Math.max(1, Math.floor(amount));

  const rec = memoryStore[key];
  const used0 = (!rec || rec.date !== date) ? 0 : rec.used;
  const used = Math.min(limit, used0 + amt);
  memoryStore[key] = { date, used };

  return { limit, used, remaining: Math.max(0, limit - used), isPaid: false, key, source: 'memory' };
}
