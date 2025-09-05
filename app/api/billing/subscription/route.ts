// app/api/billing/subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// 不设置 apiVersion，避免 TS 字面量不匹配导致的编译错误

// 这些状态算“当前可用订阅”
const ENTITLING_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
]);

async function resolveCustomerId(user: {
  id: number | string;
  email?: string | null;
  stripe_customer_id?: string | null;
  stripeCustomerId?: string | null;
}) {
  const fromUser =
    (user as any).stripe_customer_id ||
    (user as any).stripeCustomerId ||
    null;
  if (fromUser) return fromUser as string;

  if (user.email) {
    const list = await stripe.customers.list({ email: user.email, limit: 1 });
    if (list.data.length > 0) return list.data[0]!.id;
  }
  return null;
}

function mapSubToResponse(s: Stripe.Subscription | null) {
  if (!s) return null;

  const item = s.items.data[0];
  const price = item?.price as Stripe.Price | undefined;

  const interval = price?.recurring?.interval ?? null;
  const priceId = price?.id ?? null;
  const productId =
    typeof price?.product === 'string'
      ? price?.product
      : price?.product?.id ?? null;

  // 展示名：price.nickname > product.name > priceId
  const displayName =
    price?.nickname ??
    (typeof price?.product !== 'string'
      ? price?.product?.name ?? null
      : null) ??
    priceId ??
    'Subscription';

  // 结束时间：如果标记了 cancel_at_period_end，用 current_period_end；否则取 ended_at/cancel_at
  const ends_at =
    s.cancel_at_period_end === true
      ? s.current_period_end
      : s.cancel_at ?? s.ended_at ?? null;

  return {
    id: s.id,
    status: s.status,
    interval, // 'month' | 'year' | null
    cancel_at_period_end: s.cancel_at_period_end ?? false,
    current_period_end: s.current_period_end ?? null,
    ends_at,
    display_name: displayName,
    price_id: priceId,
    product_id: productId,
  };
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ current: null }, { status: 200 });
  }

  const customerId = await resolveCustomerId(user as any);
  if (!customerId) {
    // 没有 Stripe Customer 就当无订阅
    return NextResponse.json({ current: null }, { status: 200 });
  }

  // 查找该用户的订阅（取几条里挑一个“有效状态”的）
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 5,
    expand: ['data.items.data.price.product'],
  });

  const current =
    subs.data.find((s) => ENTITLING_STATUSES.has(s.status)) ?? null;

  return NextResponse.json({
    current: mapSubToResponse(current),
  });
}
