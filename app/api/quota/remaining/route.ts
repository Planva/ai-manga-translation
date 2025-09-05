// app/api/quota/remaining/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 动态导入，避免在构建期读取 env
    const { getDailyRemaining } = await import('@/lib/limits/quota');
    const data = await getDailyRemaining(req);

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[quota/remaining] error:', e?.stack || e);
    return Response.json(
      { error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
