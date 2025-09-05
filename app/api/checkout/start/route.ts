// app/api/checkout/start/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { STRIPE_PRICES, FALLBACK_PRICE_META } from '@/lib/pay/prices';
import { supabase } from '@/lib/db/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

type PriceId = (typeof STRIPE_PRICES)[keyof typeof STRIPE_PRICES];

type Body = {
  priceId?: PriceId;
  successUrl?: string;
  cancelUrl?: string;
};

async function getUserEmail(): Promise<string | undefined> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return undefined;
    return data.user?.email ?? undefined; // 不返回 null，返回 undefined
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body | undefined;

    const priceId = body?.priceId;
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const origin =
      (body?.successUrl ? new URL(body.successUrl).origin : null) ??
      req.headers.get('origin') ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';

    const email = await getUserEmail();

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId as string, quantity: 1 }],
      success_url:
        body?.successUrl ?? `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body?.cancelUrl ?? `${origin}/billing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // 只有在有邮箱时才加上该字段，避免 string|null
      ...(email ? { customer_email: email } : {}),
      metadata: {
        price_id: priceId as string,
        plan: FALLBACK_PRICE_META[priceId]?.name ?? 'unknown',
      },
    };

    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('checkout/start error', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
