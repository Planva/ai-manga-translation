// app/api/wallet/summary/route.ts
export const runtime = 'edge';

import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { getSession } from '@/lib/auth/session';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    const userId = Number(session?.user?.id);
    if (!Number.isInteger(userId)) {
      return Response.json({ loggedIn: false, balance: 0 });
    }

    // 1) 优先读钱包
    const { data: wallet } = await supabase
      .from('credit_wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (wallet?.balance != null) {
      return Response.json({ loggedIn: true, balance: wallet.balance });
    }

    // 2) 兜底：没有钱包行时按流水合计
    const { data: sumRow } = await supabase
      .from('credit_ledger')
      .select('sum:delta.sum')
      .eq('user_id', userId)
      .maybeSingle();

    const total = Number((sumRow as any)?.sum ?? 0);
    return Response.json({ loggedIn: true, balance: total });
  } catch (e) {
    console.error('[wallet/summary] err:', e);
    return Response.json({ loggedIn: false, balance: 0 });
  }
}
