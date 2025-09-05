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

type Body = {
  // 约束 priceId 必须是你在 STRIPE_PRICES 里定义过的值
  priceId?: (typeof STRIPE_PRICES)[keyof typeof STRIPE_PRICES];
  successUrl?: string;
  cancelUrl?: string;
};

async function getUserEmail() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return null;
    return data.user.email;
  } catch {
    return null;
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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body?.successUrl ?? `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body?.cancelUrl ?? `${origin}/billing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: await getUserEmail(),
      metadata: {
        price_id: priceId,
        plan: FALLBACK_PRICE_META[priceId]?.name ?? 'unknown',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('checkout/start error', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
