// app/api/quota/remaining/route.ts
export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { getDailyRemaining } from '@/lib/limits/quota';

export async function GET(req: NextRequest) {
  try {
    const data = await getDailyRemaining(req);
    return Response.json(data);
  } catch (e: any) {
    console.error('[quota/remaining] error:', e?.stack || e);
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
