// app/api/billing/subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';

export const runtime = 'nodejs'; // 降低 Edge 相关的运行时限制告警
export const dynamic = 'force-dynamic';

// 用 basil 版本的 API（与 stripe@18.1.0 类型对齐）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  // 在 Cloudflare/Vercel 等环境中用原生 fetch
  httpClient: Stripe.createFetchHttpClient(),
});

// 认为属于“当前可使用”的订阅状态集合
const ENTITLING_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  // 视业务需要也可把 'paused' 算作可用
]);

/**
 * 根据用户信息解析/查找对应的 Stripe Customer ID
 * - 这里与 billing/portal 的解析逻辑保持一致：优先通过 email 查询
 */
async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  if (!user?.email) return null;

  try {
    // 需要启用 customers.search，仅用于读取已有客户；不负责创建
    const found = await stripe.customers.search({
      query: `email:'${user.email.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    const first = found?.data?.[0];
    return first?.id ?? null;
  } catch {
    // 某些环境没开 search 权限时，静默失败返回 null
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

    // 没找到 Customer，直接返回空结果（让前端根据需要引导用户走开通/绑定流程）
    if (!customerId) {
      return NextResponse.json({ current: null, all: [] });
    }

    // 拉取订阅；不指定 status，取全部再在本地筛
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 50,
      expand: ['data.items.data.price.product'],
    });

    // 统一把 Stripe.Subscription 映射到前端需要的轻量结构
    const all = (subs?.data ?? []).map((s: Stripe.Subscription) => {
      const firstItem = s.items?.data?.[0];
      const price = firstItem?.price as Stripe.Price | undefined;
      const product = typeof price?.product !== 'string' ? (price?.product as Stripe.Product) : undefined;

      // 订阅展示名优先级：price.nickname > product.name > priceId > 'Subscription'
      const planLabel =
        price?.nickname ??
        (product?.name ?? price?.id ?? 'Subscription');

      return {
        id: s.id,
        status: s.status,
        plan: planLabel,
        priceId: price?.id ?? null,
        productId: (typeof price?.product === 'string' ? price.product : product?.id) ?? null,
        price: price?.unit_amount ?? null, // 单位：分
        currency: price?.currency ?? null,
        quantity: firstItem?.quantity ?? 1,
        // 注意：严格使用 snake_case 字段名（与 Stripe.Subscription 类型一致）
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end ?? false,
        ends_at: s.cancel_at_period_end ? s.current_period_end : null,
        // 如需更多字段可继续补充：start_date, created 等
      };
    });

    // 选出一个“当前可用订阅”作为 current
    // 策略：按 ENTITLING_STATUSES 过滤；再按状态优先级与结束时间排序
    const statusRank: Record<string, number> = {
      active: 1,
      trialing: 2,
      past_due: 3,
      unpaid: 4,
      // 其他状态默认较低优先级
    };

    const current =
      all
        .filter((s) => ENTITLING_STATUSES.has(s.status as Stripe.Subscription.Status))
        .sort((a, b) => {
          const ra = statusRank[a.status] ?? 99;
          const rb = statusRank[b.status] ?? 99;
          if (ra !== rb) return ra - rb;
          // 结束时间晚的优先
          const ea = a.current_period_end ?? 0;
          const eb = b.current_period_end ?? 0;
          return eb - ea;
        })[0] ?? null;

    return NextResponse.json({ current, all });
  } catch (e: any) {
    // 统一错误返回，避免类型检查失败
    return NextResponse.json(
      { current: null, all: [], error: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
