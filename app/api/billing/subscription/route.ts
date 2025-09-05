// app/api/billing/subscription/route.ts
export const runtime = 'edge';

import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

// 在 Cloudflare Pages/Edge 使用 fetch 客户端，避免 Node http 依赖
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(),
});

const ENTITLING_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']);

async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  const found = new Map<string, Stripe.Customer>();

  // 通过 metadata 查询
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 50,
    });
    for (const c of byMeta.data) found.set(c.id, c);
  } catch {}

  // 通过 email 再查一遍
  if (user.email) {
    try {
      const byEmail = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 50,
      });
      for (const c of byEmail.data) found.set(c.id, c);
    } catch {}
  }

  if (found.size === 0) {
    const created = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { app_user_id: String(user.id) },
    });
    return created.id;
  }
  return [...found.keys()][0];
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const customerId = await resolveCustomerId({ id: user.id, email: user.email, name: user.name });

    // 只展开到 price，避免 Product/DeletedProduct 联合类型
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.items.data.price'],
    });

    const usable = subs.data.filter((s) => ENTITLING_STATUSES.has(s.status as any));

    let current:
      | {
          id: string;
          status: string;
          interval: Stripe.Price.Recurring['interval'] | null;
          display_name: string | null;
          unit_amount: number | null;
          currency: string | null;
          quantity: number;
          current_period_end: number; // 返回值沿用旧键名，读取用驼峰
          cancel_at_period_end: boolean;
          ends_at: number | null;
        }
      | null = null;

    if (usable.length > 0) {
      const order = ['active', 'trialing', 'past_due', 'unpaid'] as const;
      usable.sort((a, b) => order.indexOf(a.status as any) - order.indexOf(b.status as any));

      const s = usable[0];
      const item = s.items.data[0];
      const price = item?.price as Stripe.Price | undefined;

      const displayName = price?.nickname ?? null;

      current = {
        id: s.id,
        status: s.status,
        interval: price?.recurring?.interval ?? null,
        display_name: displayName,
        unit_amount: price?.unit_amount ?? null,
        currency: price?.currency ?? null,
        quantity: item?.quantity ?? 1,
        // ⬇⬇ 关键：使用 basil 类型的驼峰字段
        current_period_end: s.currentPeriodEnd,
        cancel_at_period_end: s.cancelAtPeriodEnd ?? false,
        ends_at: s.cancelAtPeriodEnd ? s.currentPeriodEnd : null,
      };
    }

    const all = subs.data.map((s) => {
      const it = s.items.data[0];
      const p = it?.price as Stripe.Price | undefined;
      return {
        id: s.id,
        status: s.status,
        interval: p?.recurring?.interval ?? null,
        unit_amount: p?.unit_amount ?? null,
        currency: p?.currency ?? null,
        quantity: it?.quantity ?? 1,
        // ⬇⬇ 同样使用驼峰字段读取，再输出为旧键名
        cancel_at_period_end: s.cancelAtPeriodEnd ?? false,
        current_period_end: s.currentPeriodEnd,
      };
    });

    return Response.json({ current, all, customer_id: customerId });
  } catch (e: any) {
    console.error('[billing/subscription] error:', e);
    return Response.json({ current: null, all: [], error: e?.message ?? String(e) }, { status: 200 });
  }
}
