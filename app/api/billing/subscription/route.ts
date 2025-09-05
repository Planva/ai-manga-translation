// app/api/billing/subscription/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// 这些状态才视为“有权限”的订阅
const ENTITLING_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
]);

/** 统一把 Subscription 映射成前端可用的瘦对象 */
function toDto(s: any) {
  const items = s?.items?.data ?? [];
  const firstItem = items[0];
  const price = firstItem?.price;

  const current_period_end =
    (s as any)['current_period_end'] ??
    (s as any)['currentPeriodEnd'] ??
    null;

  const cancel_at_period_end =
    (s as any)['cancel_at_period_end'] ??
    (s as any)['cancelAtPeriodEnd'] ??
    false;

  return {
    id: s?.id ?? null,
    status: s?.status ?? null,
    priceId: price?.id ?? null,
    nickname: price?.nickname ?? null,
    unit_amount: price?.unit_amount ?? null,
    currency: price?.currency ?? null,
    quantity: firstItem?.quantity ?? 1,
    cancel_at_period_end,
    current_period_end,
  };
}

async function resolveCustomerId(
  stripe: any,
  user: { id: number | string; email?: string | null; name?: string | null }
) {
  const found = new Map<string, any>();

  // 1) 按 metadata.app_user_id
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 50,
    });
    for (const c of byMeta.data) found.set(c.id, c);
  } catch { /* ignore */ }

  // 2) 按 email
  if (user.email) {
    try {
      const byEmail = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 50,
      });
      for (const c of byEmail.data) found.set(c.id, c);
    } catch { /* ignore */ }
  }

  // 3) 命中则返回
  if (found.size > 0) return [...found.keys()][0];

  // 4) 创建
  const created = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { app_user_id: String(user.id) },
  });
  return created.id;
}

export async function GET() {
  try {
    // 动态导入，避免构建期触发
    const [{ getUser }, { default: Stripe }] = await Promise.all([
      import('@/lib/db/queries'),
      import('stripe'),
    ]);

    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 在 Edge/Workers 使用 fetch http client（若可用）
    // 不显式设置 apiVersion，避免类型字面量导致的编译/打包问题
    // @ts-ignore
    const stripe = new Stripe(apiKey, {
      // @ts-ignore
      httpClient: (Stripe as any).createFetchHttpClient?.(),
    });

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const customerId = await resolveCustomerId(stripe, {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
    });

    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.items.data.price'],
    });

    const usable = list.data.filter((s: any) =>
      ENTITLING_STATUSES.has(s?.status)
    );

    // 选一个当前生效的订阅：active > trialing > past_due > unpaid
    const rank: Record<string, number> = {
      active: 4,
      trialing: 3,
      past_due: 2,
      unpaid: 1,
    };
    const current =
      usable.length > 0
        ? usable
            .slice()
            .sort(
              (a: any, b: any) =>
                (rank[b?.status] ?? 0) - (rank[a?.status] ?? 0)
            )[0]
        : null;

    const all = list.data.map((s: any) => toDto(s));
    const currentDto = current ? toDto(current) : null;

    return NextResponse.json(
      { current: currentDto, all, customer_id: customerId },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error('[billing/subscription] error:', e?.stack || e);
    return NextResponse.json(
      { current: null, all: [], error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
