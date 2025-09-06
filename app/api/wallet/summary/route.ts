// app/api/wallet/summary/route.ts
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { creditWallet } from '@/lib/db/schema_billing';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    const rawId = session?.user?.id;
    const userId = Number(rawId);

    if (!Number.isInteger(userId)) {
      // 未登录 / 无效 id 一律返回 0
      return Response.json({ loggedIn: false, balance: 0 });
    }


    const rows = await db
      .select({ balance: creditWallet.balance })
      .from(creditWallet)
      .where(eq(creditWallet.userId, userId))
      .limit(1);

    return Response.json({
      loggedIn: true,
      balance: rows[0]?.balance ?? 0,
    });
  } catch (e) {
    console.error('[wallet/summary] err:', e);
    // 不抛 500，前端当 0 处理
    return Response.json({ loggedIn: false, balance: 0 });
  }
}
