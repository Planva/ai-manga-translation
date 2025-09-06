// app/api/billing/subscription/route.ts
export const runtime = 'nodejs';

import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

// 若你在 lockfile 中的类型只接受 '2025-04-30.basil'，下面这一行是 OK 的；
// 如果依然出现 apiVersion 字面量不匹配的报错，可改成：new Stripe(process.env.STRIPE_SECRET_KEY!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });

const ENTITLING_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']); // 这些才算“当前可用订阅”

async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  const found = new Map<string, Stripe.Customer>();

  // 1) 通过 metadata['app_user_id'] 找
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 50,
    });
    for (const c of byMeta.data) found.set(c.id, c);
  } catch {}

  // 2) 通过 email 找
  if (user.email) {
    try {
      const byEmail = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 50,
      });
      for (const c of byEmail.data) found.set(c.id, c);
    } catch {}
  }

  // 3) 找不到就创建
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
    const usable = subs.data.filter((s) => ENTITLING_STATUSES.has((s as any).status));
    let current: any = null;

    if (usable.length > 0) {
      // 简单选一个最重要的（active 优先，其次 trialing...）
      const order = ['active', 'trialing', 'past_due', 'unpaid'];
      usable.sort((a, b) => order.indexOf((a as any).status) - order.indexOf((b as any).status));

      const s = usable[0] as Stripe.Subscription;
      const item = s.items.data[0];
      const price = item?.price as Stripe.Price | undefined;

      // product 名称：不再展开 product，若需要展示友好名，优先 price.nickname
      const displayName = price?.nickname ?? null;

      // ✦ 关键：在新 SDK 类型下，以下字段可能被标为条件存在；用 any 读取以通过 TS 检查
      const currentPeriodEnd: number | null = (s as any).current_period_end ?? null;
      const cancelAtPeriodEnd: boolean = (s as any).cancel_at_period_end ?? false;

      current = {
        id: s.id,
        status: (s as any).status,
        interval: price?.recurring?.interval ?? null,
        display_name: displayName,
        unit_amount: price?.unit_amount ?? null,
        currency: price?.currency ?? null,
        quantity: item?.quantity ?? 1,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        // 衍生字段：若已设置到期取消，给出 ends_at，供前端展示“将于…失效”
        ends_at: cancelAtPeriodEnd ? currentPeriodEnd : null,
      };
    }

    // all 供调试/扩展使用（不影响前端显示）
    const all = subs.data.map((s) => {
      const it = s.items.data[0];
      const p = it?.price as Stripe.Price | undefined;

      const curEnd: number | null = (s as any).current_period_end ?? null;
      const cancelAt: boolean = (s as any).cancel_at_period_end ?? false;

      return {
        id: s.id,
        status: (s as any).status,
        interval: p?.recurring?.interval ?? null,
        unit_amount: p?.unit_amount ?? null,
        currency: p?.currency ?? null,
        quantity: it?.quantity ?? 1,
        cancel_at_period_end: cancelAt,
        current_period_end: curEnd,
      };
    });

    return Response.json({ current, all, customer_id: customerId });
  } catch (e: any) {
    console.error('[billing/subscription] error:', e);
    return Response.json({ current: null, all: [], error: e?.message ?? String(e) });
  }
}
