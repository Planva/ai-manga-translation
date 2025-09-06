// app/api/billing/portal/route.ts
export const runtime = 'nodejs';

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

// 与 subscription 接口一致的解析，确保两边拿到同一个 Customer
async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  const candidates = new Map<string, Stripe.Customer>();

  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 100,
    });
    for (const c of byMeta.data) candidates.set(c.id, c);
  } catch {}

  if (user.email) {
    try {
      const byEmail = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 100,
      });
      for (const c of byEmail.data) candidates.set(c.id, c);
    } catch {}
  }

  // 若没有候选，则创建一个
  if (candidates.size === 0) {
    const created = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { app_user_id: String(user.id) },
    });
    return created.id;
  }

  // 有就取第一个（无所谓顺序，Portal 里也能看到和管理所有订阅/支付方式）
  return [...candidates.keys()][0];
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new Response('STRIPE_SECRET_KEY not set', { status: 500 });
    }

    const user = await getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const customerId = await resolveCustomerId({ id: user.id, email: user.email, name: user.name });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: new URL('/dashboard?portal=1', req.url).toString(),
    });

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (e: any) {
    console.error('[billing/portal] error:', e);
    const msg = process.env.NODE_ENV === 'development'
      ? `Unable to open billing portal: ${e?.message ?? e}`
      : 'Unable to open billing portal';
    return new Response(msg, { status: 500 });
  }
}
