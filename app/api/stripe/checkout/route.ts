// app/api/stripe/checkout/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) throw new Error('Missing STRIPE_SECRET_KEY');

const stripe = new Stripe(SECRET, {
  httpClient: Stripe.createFetchHttpClient(),
});

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const origin =
      asString(body?.origin) ||
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;

    const priceId = asString(body?.priceId);
    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    const successUrl =
      asString(body?.successUrl) ||
      `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      asString(body?.cancelUrl) ||
      `${origin}/billing?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'stripe error' }, { status: 500 });
  }
}
