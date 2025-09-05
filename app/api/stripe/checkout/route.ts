// app/api/stripe/checkout/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const priceId: string | undefined = body?.priceId ?? body?.price_id;
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const successUrl: string =
      (typeof body?.successUrl === 'string' && body.successUrl) ||
      `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl: string =
      (typeof body?.cancelUrl === 'string' && body.cancelUrl) ||
      `${origin}/billing?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',              // 一次性付款请改为 'payment'
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { price_id: priceId },
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Checkout error' }, { status: 400 });
  }
}
