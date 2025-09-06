// app/api/checkout/route.ts
export const runtime = 'nodejs';

import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SITE_URL } from '@/lib/env';
import { STRIPE_PRICES, FALLBACK_PRICE_META } from '@/lib/pay/prices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
  const mode = fallback?.type === 'sub' ? 'subscription' : 'payment';

  const stripeSession = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/checkout/success?sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/pricing?canceled=1`,
    allow_promotion_codes: true,
    customer_email: email,
    client_reference_id: userId, // 方便 webhook 里快速定位用户
    metadata: {
      userId, // 双保险
    },
  });

  return Response.json({ url: stripeSession.url });
}
