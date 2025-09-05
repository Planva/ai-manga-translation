// app/api/wallet/summary/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 动态导入，避免构建期读取 env / 初始化客户端
    const [{ getSession }, { supabase }] = await Promise.all([
      import('@/lib/auth/session'),
      import('@/lib/db/supabase'),
    ]);

    const session = await getSession();
    const userId = Number(session?.user?.id);
    if (!Number.isInteger(userId)) {
      return Response.json(
        { loggedIn: false, balance: 0 },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // 1) 优先读钱包表
    const { data: wallet, error: wErr } = await supabase
      .from('credit_wallet')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (wErr) {
      console.error('[wallet/summary] wallet query error:', wErr);
    }

    if (wallet?.balance != null) {
      return Response.json(
        { loggedIn: true, balance: wallet.balance },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // 2) 兜底：没有钱包行时按流水合计
    const { data: sumRow, error: sErr } = await supabase
      .from('credit_ledger')
      .select('sum:delta.sum')
      .eq('user_id', userId)
      .maybeSingle();

    if (sErr) {
      console.error('[wallet/summary] ledger sum error:', sErr);
    }

    const total = Number((sumRow as any)?.sum ?? 0);
    return Response.json(
      { loggedIn: true, balance: total },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    console.error('[wallet/summary] err:', e?.stack || e);
    return Response.json(
      { loggedIn: false, balance: 0, error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
