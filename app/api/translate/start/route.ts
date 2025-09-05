// app/api/translate/start/route.ts
export const runtime = 'edge';

function stripDataUrl(dataUrl: string) {
  // data:image/png;base64,XXXX → 纯 base64
  const i = dataUrl.indexOf(',');
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      image,              // dataURL 或 http(s) URL
      translator,         // { translator, target_lang, ... }
      verticalMode,       // 'auto'|'horizontal'|'vertical' 兼容旧版
      output_format = 'png',
      config,             // v1.6+ 整段 config
    } = body || {};

    if (!image || !translator) {
      return new Response(JSON.stringify({ error: 'Missing image or translator' }), { status: 400 });
    }

    const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;
    const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
    if (!ENDPOINT_ID || !RUNPOD_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing RUNPOD_* env' }), { status: 500 });
    }

    // 合并/兜底 config.render.direction（兼容你旧的 verticalMode）
    let cfg: any = (config && typeof config === 'object') ? { ...config } : {};
    const dir =
      verticalMode === 'horizontal' ? 'horizontal' :
      verticalMode === 'vertical'   ? 'vertical'   : 'auto';

    cfg.render = {
      renderer: 'manga2eng',
      alignment: 'center',
      font_size_minimum: 9,
      font_size_offset: 0,
      line_spacing: 0,
      direction: cfg?.render?.direction ?? dir,
      ...(cfg.render || {}),
    };
    // 其余块不强制，保持前端传入
    if (!cfg.detector) cfg.detector = { detector: 'default', detection_size: 2560, unclip_ratio: 2.3, box_threshold: 0.70 };
    if (!cfg.ocr)      cfg.ocr      = { ocr: 'mocr', use_mocr_merge: false, min_text_length: 0 };
    if (typeof cfg.mask_dilation_offset !== 'number') cfg.mask_dilation_offset = 24;

    // 组装 RunPod payload
    const input: any = {
      image: /^https?:\/\//i.test(image) ? image : stripDataUrl(String(image)),
      use_gpu: true,
      attempts: 1,
      output_format,
      translator,   // 直接透传
      config: cfg,
      // 兼容旧后端（如果仍然读取 rendering）
      rendering: {
        vertical_text: verticalMode === 'vertical',
        text_direction: dir,
      },
    };

    const rp = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });

    const json = await rp.json().catch(() => ({}));
    if (!rp.ok || !json?.id) {
      return new Response(JSON.stringify({ error: 'RunPod run failed', detail: json }), { status: 502 });
    }

    // 前端期望：{ jobId }
    return new Response(JSON.stringify({ jobId: json.id }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
}
