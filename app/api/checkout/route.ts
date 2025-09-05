// app/api/checkout/route.ts
export const runtime = 'nodejs';

import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SITE_URL } from '@/lib/env';
import { STRIPE_PRICES, FALLBACK_PRICE_META } from '@/lib/pay/prices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

function isKnownPrice(priceId: string): priceId is typeof STRIPE_PRICES[keyof typeof STRIPE_PRICES] {
  return Object.values(STRIPE_PRICES).includes(priceId as any);
}

export async function POST(req: NextRequest) {
  const { priceId } = await req.json();
  if (!priceId || !isKnownPrice(priceId)) {
    return new Response('Unknown priceId', { status: 400 });
  }

  const session = await getSession();
  const userId = session?.user?.id;
  const email = session?.user?.email || undefined;

  if (!userId) {
    return new Response('Please login first.', { status: 401 });
  }

  const fallback = FALLBACK_PRICE_META[priceId];
  const mode: 'payment' | 'subscription' = fallback?.type === 'sub' ? 'subscription' : 'payment';

  const base: Stripe.Checkout.SessionCreateParams = {
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/pricing?canceled=1`,
    allow_promotion_codes: true,
    customer_email: email,
    client_reference_id: String(userId),
    // 注意：仅把 userId 放在 session.metadata **不够**，订阅/发票读不到
    metadata: { userId: String(userId) },
  };

  // ✅ 关键：如果是订阅，把 userId 同步写到「订阅本身」的 metadata
  if (mode === 'subscription') {
    (base as Stripe.Checkout.SessionCreateParams).subscription_data = {
      metadata: { userId: String(userId) },
    };
    // 你也可以在这里加 trial 或其他订阅参数
    // (base as any).subscription_data = { ... , trial_period_days: 14 }
  }

  const stripeSession = await stripe.checkout.sessions.create(base);
  return Response.json({ url: stripeSession.url });
}
