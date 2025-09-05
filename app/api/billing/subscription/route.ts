// app/api/billing/subscription/route.ts
export const runtime = 'edge';

import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const ENTITLING_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']); // 这些才算“当前可用订阅”

async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  const found = new Map<string, Stripe.Customer>();

  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 50,
    });
    for (const c of byMeta.data) found.set(c.id, c);
  } catch {}

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

    // 只展开到 price，避免“展开层级过深”的 400
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.items.data.price'],
    });

    // 选出“当前可用订阅”（只要在 ENTITLING_STATUSES 中才算）
    const usable = subs.data.filter((s) => ENTITLING_STATUSES.has(s.status as any));
    let current: any = null;

    if (usable.length > 0) {
      // 简单选一个最重要的（active 优先，其次 trialing...）
      const order = ['active', 'trialing', 'past_due', 'unpaid'];
      usable.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

      const s = usable[0];
      const item = s.items.data[0];
      const price = item?.price as Stripe.Price | undefined;

      // product 名称：不再展开 product，若需要展示友好名，优先 price.nickname
      const displayName = price?.nickname ?? null;

      current = {
        id: s.id,
        status: s.status,
        interval: price?.recurring?.interval ?? null,
        display_name: displayName,
        unit_amount: price?.unit_amount ?? null,
        currency: price?.currency ?? null,
        quantity: item?.quantity ?? 1,
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end ?? true,
        // 衍生字段：若已设置到期取消，给出 ends_at，供前端展示“将于…失效”
        ends_at: s.cancel_at_period_end ? s.current_period_end : null,
      };
    }

    // all 供调试/扩展使用（不影响前端显示）
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
        cancel_at_period_end: s.cancel_at_period_end ?? false,
        current_period_end: s.current_period_end,
      };
    });

    return Response.json({ current, all, customer_id: customerId });
  } catch (e: any) {
    console.error('[billing/subscription] error:', e);
    return Response.json({ current: null, all: [], error: e?.message ?? String(e) });
  }
}
