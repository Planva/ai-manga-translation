// app/api/checkout/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

// 用 fetch http client 以兼容 Edge；不指定 apiVersion，避免类型卡死
const stripe = new Stripe(SECRET, {
  httpClient: Stripe.createFetchHttpClient(),
});

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

export async function POST(req: Request) {
  try {
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
      // 可选：在 Session 侧加点标记供你后台核对
      metadata: {
        price_id: priceId,
        plan: mode === 'subscription' ? 'sub_auto' : 'pack_auto',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
