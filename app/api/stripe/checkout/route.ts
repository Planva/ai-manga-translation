// app/api/stripe/checkout/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

export async function POST(req: Request) {
  try {
    // 动态导入 Stripe，避免构建期读取 env
    const { default: Stripe } = await import('stripe');
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const stripe = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(), // 兼容 Edge
      // 不手动指定 apiVersion，避免 basil 类型冲突
    });

    const body = await req.json().catch(() => ({} as any));

    const priceId = asString(body?.priceId ?? body?.price_id);
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin =
      asString(body?.origin) ||
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;

    const mode: 'payment' | 'subscription' =
      body?.mode === 'payment' ? 'payment' : 'subscription';

    const successUrl =
      asString(body?.successUrl) ||
      `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      asString(body?.cancelUrl) || `${origin}/billing?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { price_id: priceId },
    });

    return NextResponse.json(
      { id: session.id, url: session.url },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[stripe/checkout] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Checkout error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
