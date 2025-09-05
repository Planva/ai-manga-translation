// app/api/quota/consume/route.ts
export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { consumeUnits } from '@/lib/limits/quota';

export async function POST(req: NextRequest) {
  try {
    const { amount = 1 } = await req.json();
    const data = await consumeUnits(req, Number(amount) || 1);
    return Response.json(data);
  } catch (e: any) {
    console.error('[quota/consume] error:', e?.stack || e);
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
