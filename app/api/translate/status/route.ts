// app/api/translate/status/route.ts
export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;
    const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
    if (!ENDPOINT_ID || !RUNPOD_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing RUNPOD_* env' }), { status: 500 });
    }

    const r = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/status/${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${RUNPOD_API_KEY}` },
    });

    const j = await r.json().catch(() => ({}));

    // 透传核心状态给前端
    if (j?.status === 'COMPLETED' && j?.output?.image_b64) {
      return new Response(JSON.stringify({ status: 'COMPLETED', image_b64: j.output.image_b64 }), { status: 200 });
    }
    if (j?.status === 'FAILED' || j?.status === 'CANCELLED') {
      return new Response(JSON.stringify({ status: j.status, error: j?.error || 'Run failed' }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: j?.status || 'IN_PROGRESS' }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ status: 'FAILED', error: String(e?.message || e) }), { status: 200 });
  }
}
