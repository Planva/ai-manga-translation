// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';          // ⚠️确保不是 edge
export const dynamic = 'force-dynamic';
export const maxDuration = 300;           // ⚠️Vercel 上将允许更长执行

const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID!;
const API_KEY     = process.env.RUNPOD_API_KEY!;
const RUNPOD_URL  = `https://api.runpod.ai/v2/${ENDPOINT_ID}/runsync`;
const REQ_TIMEOUT_MS = 120_000;           // 可按需增大

function mapRendering(verticalMode: 'auto'|'horizontal'|'vertical') {
  if (verticalMode === 'horizontal') {
    return { vertical_text: false, text_direction: 'ltr' };
  }
  if (verticalMode === 'vertical') {
    return { vertical_text: true, text_direction: 'auto' };
  }
  // auto：以漫画常用竖排为默认
  return { vertical_text: true, text_direction: 'auto' };
}

function stripDataUrl(image: string) {
  const m = image.match(/^data:image\/\w+;base64,(.+)$/);
  return m ? m[1] : image; // RunPod handler 支持 URL 或 base64；这里统一为纯 base64
}

export async function POST(req: NextRequest) {
  try {
    if (!ENDPOINT_ID || !API_KEY) {
      return NextResponse.json({ error: 'Server not configured: RUNPOD_ENDPOINT_ID/RUNPOD_API_KEY missing.' }, { status: 500 });
    }

    const body = await req.json();
    const { image, translator, verticalMode } = body || {};
    if (!image || !translator?.translator || !translator?.target_lang) {
      return NextResponse.json({ error: 'Missing required fields: image, translator.translator, translator.target_lang' }, { status: 400 });
    }

    const rendering = mapRendering(verticalMode || 'auto');

    // 兼容 dataURL
    const imageInput = stripDataUrl(image);

    const payload = {
      input: {
        image: imageInput,                 // 纯 base64 或 URL
        attempts: 1,
        use_gpu: true,
        translator: {
          translator: translator.translator,  // offline / sugoi / m2m100 / chatgpt / ...
          target_lang: translator.target_lang,
          device: translator.device || 'cuda',
          compute_type: translator.compute_type || 'float16',
        },
        rendering,
      },
    };

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), REQ_TIMEOUT_MS);

    const r = await fetch(RUNPOD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch((e) => {
      throw new Error(`Fetch to RunPod failed: ${String(e?.message || e)}`);
    });
    clearTimeout(t);

    const j = await r.json().catch(() => ({}));

    // 按 RunPod 返回结构做健壮判断
    const img = j?.output?.image_b64;
    const log = j?.output?.log_tail;
    const err = j?.error;

    if (!r.ok || (!img && !log && err)) {
      return NextResponse.json({ error: `RunPod error: ${err || 'Unknown'}`, log_tail: log || '' }, { status: 502 });
    }
    if (!img) {
      // 有 log 但没图，视为失败，把 tail 透给前端
      return NextResponse.json({ error: 'No output image found', log_tail: log || '' }, { status: 502 });
    }

    // 成功：只回需要的字段
    return NextResponse.json({ image_b64: img, log_tail: log || '' });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const aborted = /AbortError/i.test(msg);
    return NextResponse.json(
      { error: aborted ? `RunPod request timed out (${REQ_TIMEOUT_MS}ms)` : msg },
      { status: aborted ? 504 : 500 }
    );
  }
}
