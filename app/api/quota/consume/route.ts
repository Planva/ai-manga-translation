// app/api/quota/consume/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 动态导入，避免构建期执行并读取 env
    const { consumeUnits } = await import('@/lib/limits/quota');

    // 兼容空 body / 非 JSON
    let amount = 1;
    try {
      const body = await req.json().catch(() => ({} as any));
      amount = Number((body as any)?.amount) || 1;
    } catch {
      amount = 1;
    }

    const data = await consumeUnits(req, amount);

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[quota/consume] error:', e?.stack || e);
    return Response.json(
      { error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
