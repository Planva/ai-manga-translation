// lib/billing/credit.ts
import { db } from '@/lib/db/drizzle';
import { creditWallet, creditLedger } from '@/lib/db/schema_billing';
import { eq, sql } from 'drizzle-orm';

/**
 * 给用户增加积分（钱包余额）
 * - 方案A：users.id 为 integer。传入的 userId 可以是 string/number，但必须能转为整数。
 */
export async function addCreditsToUser(
  userIdRaw: string | number,
  delta: number,
  reason: 'pack_purchase' | 'subscription_cycle' | string,
  externalId?: string,
  meta?: Record<string, any>
) {
  if (!Number.isFinite(delta) || delta <= 0) {
    throw new Error(`addCreditsToUser: invalid delta=${delta}`);
  }

  const userId =
    typeof userIdRaw === 'number' ? userIdRaw : Number(String(userIdRaw).trim());
  if (!Number.isInteger(userId)) {
    throw new Error(`addCreditsToUser: numeric userId required (got "${userIdRaw}")`);
  }

  // 1) 钱包 upsert：balance 自增（注意是 balance，不是 credits）
  await db
    .insert(creditWallet)
    .values({
      userId,
      balance: delta,                 // ✅ 正确列名
      // updatedAt 默认 now()
    })
    .onConflictDoUpdate({
      target: [creditWallet.userId],
      set: {
        balance: sql`${creditWallet.balance} + ${delta}`,
        updatedAt: sql`now()`,
      },
    });

  // 2) 记流水
  await db.insert(creditLedger).values({
    userId,
    delta,
    reason,
    externalId,
    meta: meta ? (meta as any) : undefined,
    // createdAt 默认 now()
  });

  // 3) 返回最新余额
  const rows = await db
    .select({ balance: creditWallet.balance })
    .from(creditWallet)
    .where(eq(creditWallet.userId, userId))
    .limit(1);

  return { balance: rows[0]?.balance ?? 0 };
}
