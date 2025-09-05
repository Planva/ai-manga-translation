// app/api/billing/subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  httpClient: Stripe.createFetchHttpClient(),
});

// 当前认为“可用”的订阅状态
const ENTITLING_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
]);

async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  if (!user?.email) return null;
  try {
    const found = await stripe.customers.search({
      query: `email:'${user.email.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    const first = found?.data?.[0];
    return first?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ current: null, all: [], error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const customerId = await resolveCustomerId({
      id: (user as any)?.id,
      email: (user as any)?.email ?? null,
      name: (user as any)?.name ?? null,
    });

    if (!customerId) {
      return NextResponse.json({ current: null, all: [] });
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 50,
      expand: ['data.items.data.price.product'],
    });

    const all = (subs?.data ?? []).map((s: Stripe.Subscription) => {
      const firstItem = s.items?.data?.[0];
      const price = firstItem?.price as Stripe.Price | undefined;

      // 处理 product 可能是 string 或 DeletedProduct 的情况
      let productName: string | null = null;
      if (price && typeof price.product !== 'string' && price.product) {
        const p = price.product as Stripe.Product | Stripe.DeletedProduct;
        if (!('deleted' in p && p.deleted)) {
          productName = (p as Stripe.Product).name ?? null;
        }
      }

      const planLabel =
        price?.nickname ??
        productName ??
        price?.id ??
        'Subscription';

      return {
        id: s.id,
        status: s.status,
        plan: planLabel,
        priceId: price?.id ?? null,
        productId:
          price
            ? (typeof price.product === 'string' ? price.product : (price.product as Stripe.Product | Stripe.DeletedProduct).id)
            : null,
        price: price?.unit_amount ?? null, // 分
        currency: price?.currency ?? null,
        quantity: firstItem?.quantity ?? 1,

        // 读取 Stripe.Subscription 的“驼峰”字段，再映射到你需要的“下划线”响应字段
        current_period_end: s.currentPeriodEnd,
        cancel_at_period_end: s.cancelAtPeriodEnd ?? false,
        ends_at: s.cancelAtPeriodEnd ? s.currentPeriodEnd : null,
      };
    });

    // 选择“当前可用订阅”
    const statusRank: Record<string, number> = {
      active: 1,
      trialing: 2,
      past_due: 3,
      unpaid: 4,
    };

    const current =
      all
        .filter((s) => ENTITLING_STATUSES.has(s.status as Stripe.Subscription.Status))
        .sort((a, b) => {
          const ra = statusRank[a.status] ?? 99;
          const rb = statusRank[b.status] ?? 99;
          if (ra !== rb) return ra - rb;
          const ea = a.current_period_end ?? 0;
          const eb = b.current_period_end ?? 0;
          return eb - ea;
        })[0] ?? null;

    return NextResponse.json({ current, all });
  } catch (e: any) {
    return NextResponse.json(
      { current: null, all: [], error: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
