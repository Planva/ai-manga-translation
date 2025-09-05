// app/api/billing/subscription/route.ts
import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

export const runtime = 'nodejs';          // 避免 Edge 运行时限制
export const dynamic = 'force-dynamic';   // 该接口依赖实时数据

// Stripe v18.* 类型强约束了 apiVersion，这里用 basil 版本
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// 这些状态才视为“有权限”的订阅
const ENTITLING_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']);

/**
 * 尽量复用老客户；找不到就创建一个。
 * 先按 metadata.app_user_id 搜，再按 email；都没有时创建。
 */
async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  const found = new Map<string, Stripe.Customer>();

  // 1) 按 metadata.app_user_id
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 50,
    });
    for (const c of byMeta.data) found.set(c.id, c);
  } catch {
    // ignore
  }

  // 2) 按 email
  if (user.email) {
    try {
      const byEmail = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 50,
      });
      for (const c of byEmail.data) found.set(c.id, c);
    } catch {
      // ignore
    }
  }

  // 3) 已有则返回第一个
  if (found.size > 0) return [...found.keys()][0];

  // 4) 创建
  const created = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { app_user_id: String(user.id) },
  });
  return created.id;
}

/**
 * 统一把 Stripe.Subscription 映射成前端可用的瘦对象。
 * 注意：为兼容 basil/非 basil 字段，我们用 “双形态 + 下标取值” 读取：
 *  - current_period_end 或 currentPeriodEnd
 *  - cancel_at_period_end 或 cancelAtPeriodEnd
 */
function toDto(s: any) {
  const items = s?.items?.data ?? [];
  const firstItem = items[0];
  const price = firstItem?.price;

  const current_period_end =
    (s as any)['current_period_end'] ?? (s as any)['currentPeriodEnd'] ?? null;

  const cancel_at_period_end =
    (s as any)['cancel_at_period_end'] ?? (s as any)['cancelAtPeriodEnd'] ?? false;

  return {
    id: s?.id ?? null,
    status: s?.status ?? null,

    // 计划/价格信息（避免触发 Product | DeletedProduct 的类型分歧，不强取 product.name）
    priceId: price?.id ?? null,
    nickname: price?.nickname ?? null,
    unit_amount: price?.unit_amount ?? null,
    currency: price?.currency ?? null,
    quantity: firstItem?.quantity ?? 1,

    // 周期信息
    cancel_at_period_end,
    current_period_end,
  };
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const customerId = await resolveCustomerId({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // 只展开到 price，避免过深 expand 导致 400
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.items.data.price'],
    });

    // 过滤出“有权限”的订阅
    const usable = list.data.filter((s: any) => ENTITLING_STATUSES.has(s?.status));

    // 选一个当前生效的订阅：active > trialing > past_due > unpaid
    const rank: Record<string, number> = { active: 4, trialing: 3, past_due: 2, unpaid: 1 };
    const current =
      usable.length > 0
        ? usable.slice().sort((a: any, b: any) => (rank[b?.status] ?? 0) - (rank[a?.status] ?? 0))[0]
        : null;

    const all = list.data.map((s: any) => toDto(s));
    const currentDto = current ? toDto(current) : null;

    return Response.json({ current: currentDto, all, customer_id: customerId });
  } catch (e: any) {
    console.error('[billing/subscription] error:', e);
    return Response.json({ current: null, all: [], error: e?.message ?? String(e) });
  }
}
