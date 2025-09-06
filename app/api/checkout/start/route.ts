export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
  const mode = body?.mode as 'payment' | 'subscription'; // 'payment'：一次性；'subscription'：订阅
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

  // 读取/创建 customer
  const db = await getDb();
  const usersTable = (await import('@/lib/db/schema')).users as any; // 你的 users 表 Schema（如果这里报错，说明你没 export users schema，可以先跳过更新 customer）
  let customerId: string | null = null;

  try {
    const row = await db!.query.users.findFirst({
      where: (t: any, { eq }: any) => eq(t.id, user.id),
      columns: { stripeCustomerId: true },
    });
    customerId = row?.stripeCustomerId ?? null;
  } catch {}

  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = c.id;
    try {
      await db!.update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where((t: any, { eq }: any) => eq(t.id, user.id));
    } catch {}
  }

  const origin = process.env.APP_URL || new URL(req.url).origin;

  const checkout = await stripe.checkout.sessions.create({
    mode,
    customer: customerId || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url });
}
