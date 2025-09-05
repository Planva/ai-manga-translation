export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

async function getUser() {
  try {
    const { getSession } = await import('@/lib/auth/session');
    return await getSession();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode = body?.mode as 'payment' | 'subscription';
  if (!['payment', 'subscription'].includes(mode)) {
    return NextResponse.json({ error: 'invalid mode' }, { status: 400 });
  }

  const session = await getUser();
  const user = session?.user;
  if (!user?.id || !user?.email) {
    return NextResponse.json({ error: 'UNAUTH' }, { status: 401 });
  }

  const priceId =
    mode === 'payment' ? process.env.STRIPE_PRICE_ONETIME : process.env.STRIPE_PRICE_SUB;
  if (!priceId) return NextResponse.json({ error: 'price not configured' }, { status: 500 });

  // 读取/创建 customer —— Supabase 版
  let customerId: string | null = null;
  try {
    const { data: row } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', Number(user.id))
      .maybeSingle();
    customerId = row?.stripe_customer_id ?? null;
  } catch {}

  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = c.id;
    try {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', Number(user.id));
    } catch {}
  }

  const origin = process.env.APP_URL || new URL(req.url).origin;

  const checkout = await stripe.checkout.sessions.create({
    mode,
    customer: customerId || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    client_reference_id: String(user.id), 
    metadata: { userId: String(user.id) }, 
  });

  return NextResponse.json({ url: checkout.url });
}
