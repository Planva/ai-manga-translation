// app/api/billing/portal/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';
export const runtime = 'edge';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// ⚠ 不要设置 apiVersion，避免 TS 字面量不匹配导致的编译错误

async function resolveCustomerId(user: {
  id: number | string;
  email?: string | null;
  // 兼容不同字段命名
  stripe_customer_id?: string | null;
  stripeCustomerId?: string | null;
}) {
  // 1) 优先使用用户记录里已有的 customer id（如有）
  const fromUser =
    (user as any).stripe_customer_id ||
    (user as any).stripeCustomerId ||
    null;
  if (fromUser) return fromUser as string;

  // 2) 退化：用邮箱在 Stripe 搜索（若邮箱存在）
  if (user.email) {
    const list = await stripe.customers.list({ email: user.email, limit: 1 });
    if (list.data.length > 0) return list.data[0]!.id;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = await resolveCustomerId(user as any);
  if (!customerId) {
    return NextResponse.json(
      { error: 'Stripe customer not found for current user.' },
      { status: 404 }
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${req.nextUrl.origin}/dashboard?portal=1`,
  });

  // 302 重定向到 Billing Portal
  return NextResponse.redirect(portal.url);
}
