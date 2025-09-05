// app/api/checkout/start/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { FALLBACK_PRICE_META } from '@/lib/pay/prices';

// 小工具：把任意输入安全地收敛为字符串或 undefined
function asNonEmptyString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

// 惰性初始化 Stripe：避免构建期读取 env / 实例化
let _stripe: any;
async function getStripe() {
  if (_stripe) return _stripe;

  // 动态导入，避免打包器在构建期解析到类型字面量等
  const { default: Stripe } = await import('stripe');

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  // 在 Edge/Workers 环境优先使用 fetch http client（存在则使用）
  // 不显式指定 apiVersion，避免与本地 SDK 类型字面量不匹配
  // @ts-ignore
  _stripe = new Stripe(key, {
    // @ts-ignore
    httpClient: (Stripe as any).createFetchHttpClient?.(),
  });
  return _stripe;
}

export async function POST(req: Request) {
  try {
    const stripe = await getStripe();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // 无 body 也允许
    }

    // 解析 origin（优先 body.origin → 请求头 → APP_URL → 当前请求 URL）
    const url = new URL(req.url);
    const origin =
      asNonEmptyString(body?.origin) ||
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;

    // 校验并规范化 priceId
    const rawPriceId = asNonEmptyString(body?.priceId);
    if (!rawPriceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const priceId = rawPriceId;

    // 根据本地元数据推断结账模式与 plan 文本
    const fm = FALLBACK_PRICE_META[priceId as keyof typeof FALLBACK_PRICE_META];
    const isSub = fm?.type === 'sub';
    const plan =
      fm?.type === 'sub'
        ? `sub_${fm?.credits_per_cycle ?? 'auto'}`
        : fm?.type === 'pack'
          ? `pack_${fm?.credits ?? 'auto'}`
          : 'unknown';

    // 回跳地址（必须是 string）
    const successUrl =
      asNonEmptyString(body?.successUrl) ||
      `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      asNonEmptyString(body?.cancelUrl) || `${origin}/billing?canceled=1`;

    // 创建 Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: isSub ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { price_id: priceId, plan },
    });

    return NextResponse.json(
      { id: session.id, url: session.url },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create checkout session' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
