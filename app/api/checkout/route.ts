// app/api/checkout/route.ts
import Stripe from 'stripe';
import { getUser } from '@/lib/db/queries';
import { STRIPE_PRICES, FALLBACK_PRICE_META } from '@/lib/pay/prices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe v18 严格要求 basil 版本号
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// 价格白名单守卫（防止传入任意 priceId）
function isKnownPrice(priceId: string): priceId is (typeof STRIPE_PRICES)[keyof typeof STRIPE_PRICES] {
  return Object.values(STRIPE_PRICES).includes(priceId as any);
}

/**
 * 复用/创建 Customer（同 subscription 路由，保持一致）
 */
async function resolveCustomerId(user: { id: number | string; email?: string | null; name?: string | null }) {
  const seen = new Map<string, Stripe.Customer>();

  // 1) metadata.app_user_id
  try {
    const byMeta = await stripe.customers.search({
      query: `metadata['app_user_id']:'${String(user.id).replace(/'/g, "\\'")}'`,
      limit: 50,
    });
    for (const c of byMeta.data) seen.set(c.id, c);
  } catch {}

  // 2) email
  if (user.email) {
    try {
      const byEmail = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 50,
      });
      for (const c of byEmail.data) seen.set(c.id, c);
    } catch {}
  }

  if (seen.size > 0) return [...seen.keys()][0];

  // 3) 创建
  const created = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { app_user_id: String(user.id) },
  });
  return created.id;
}

/**
 * 创建订阅 Checkout Session
 * 支持：
 * - POST JSON: { priceId, quantity?, successUrl?, cancelUrl? }
 * - GET query: /api/checkout?priceId=...&quantity=...
 */
async function createSession(req: Request) {
  // 解析输入（优先 POST JSON）
  let priceId: string | undefined;
  let quantity: number | undefined;
  let successUrl: string | undefined;
  let cancelUrl: string | undefined;

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      priceId = body?.priceId;
      quantity = body?.quantity;
      successUrl = body?.successUrl;
      cancelUrl = body?.cancelUrl;
    } catch {
      // 如果没有 JSON，继续尝试 query
    }
  }
  if (!priceId) {
    const url = new URL(req.url);
    priceId = url.searchParams.get('priceId') ?? undefined;
    const q = url.searchParams.get('quantity');
    if (!quantity && q) quantity = Math.max(1, Number(q) || 1);
  }

  if (!priceId || !isKnownPrice(priceId)) {
    return Response.json({ error: 'Invalid or missing priceId' }, { status: 400 });
  }
  if (!quantity) quantity = 1;

  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const customer = await resolveCustomerId({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  // 成功/取消回调地址
  const origin =
    (req.headers.get('origin') && new URL(req.headers.get('origin')!)) ||
    (req.headers.get('referer') && new URL(req.headers.get('referer')!)) ||
    new URL('https://example.com');

  const okUrl =
    successUrl ??
    new URL(`/billing/return?session_id={CHECKOUT_SESSION_ID}`, origin).toString();
  const koUrl = cancelUrl ?? new URL('/billing', origin).toString();

  // 建议：在订阅对象上也打 metadata，方便回查
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ui_mode: 'hosted',
    customer,
    allow_promotion_codes: true,
    success_url: okUrl,
    cancel_url: koUrl,
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    metadata: {
      app_user_id: String(user.id),
      price_id: priceId,
    },
    subscription_data: {
      metadata: {
        app_user_id: String(user.id),
        price_id: priceId,
      },
    },
  });

  // 给前端一点展示用元信息（不触发 Product | DeletedProduct 类型分歧，只用我们本地 FALLBACK）
  const meta = (FALLBACK_PRICE_META as any)?.[priceId] ?? null;

  return Response.json({
    id: session.id,
    url: session.url,
    priceId,
    quantity,
    meta,
  });
}

export async function POST(req: Request) {
  try {
    return await createSession(req);
  } catch (e: any) {
    console.error('[checkout] POST error:', e);
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    return await createSession(req);
  } catch (e: any) {
    console.error('[checkout] GET error:', e);
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
