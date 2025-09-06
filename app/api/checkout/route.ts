// app/api/checkout/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

// —— 惰性初始化，避免在模块顶层读取环境变量 —— //
let _stripe: any;
async function getStripe() {
  if (_stripe) return _stripe;

  // 动态导入，避免打包器在构建期处理 stripe 的 node 依赖
  const { default: Stripe } = await import('stripe');

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  // 在 Edge/Workers 使用 fetch http client（可选）
  const httpClient = (Stripe as any).createFetchHttpClient?.();
  _stripe = new Stripe(key, httpClient ? { httpClient } : undefined);

  return _stripe;
}

export async function POST(req: Request) {
  try {
    const stripe = await getStripe();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // 允许无 body
    }

    const reqUrl = new URL(req.url);
    const origin =
      asString(body?.origin) ||
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${reqUrl.protocol}//${reqUrl.host}`;

    const priceId = asString(body?.priceId);
    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // 默认走订阅；也可通过 body.mode = 'payment' 指定一次性
    const mode: 'payment' | 'subscription' =
      body?.mode === 'payment' ? 'payment' : 'subscription';

    const successUrl =
      asString(body?.successUrl) ||
      `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      asString(body?.cancelUrl) ||
      `${origin}/billing?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        price_id: priceId,
        plan: mode === 'subscription' ? 'sub_auto' : 'pack_auto',
      },
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
