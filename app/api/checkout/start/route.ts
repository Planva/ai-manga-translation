// app/api/checkout/start/route.ts


export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { STRIPE_PRICES, FALLBACK_PRICE_META } from '@/lib/pay/prices';

// —— 建议：环境变量缺失时直接报错，避免隐藏问题 ——
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

// 注意：stripe@18.x 当前类型把 apiVersion 锁为 "2025-04-30.basil"
// 如不想锁版本，也可直接去掉 apiVersion 这行，使用 SDK 默认值
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

// 小工具：把任意输入安全地收敛为字符串或 undefined
function asNonEmptyString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // 无 body 也允许，走默认分支
    }

    // 解析 origin（优先 body.origin → 请求头 → APP_URL → 当前请求 URL）
    const url = new URL(req.url);
    const origin =
      asNonEmptyString(body?.origin) ||
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;

    // 校验并规范化 priceId，避免 string | null 进入 create()
    const rawPriceId = asNonEmptyString(body?.priceId);
    if (!rawPriceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 },
      );
    }
    const priceId = rawPriceId as string;

    // 根据本地元数据推断结账模式与用于追踪的 plan 文本（不依赖 name 字段）
    const fm = FALLBACK_PRICE_META[
      priceId as keyof typeof FALLBACK_PRICE_META
    ];
    const isSub = fm?.type === 'sub';

    const plan =
      fm?.type === 'sub'
        ? `sub_${fm?.credits_per_cycle ?? 'auto'}`
        : fm?.type === 'pack'
          ? `pack_${fm?.credits ?? 'auto'}`
          : 'unknown';

    // 处理回跳地址，确保传入 stripe 的都是 string（不允许 null）
    const successUrl =
      asNonEmptyString(body?.successUrl) ||
      `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      asNonEmptyString(body?.cancelUrl) || `${origin}/billing?canceled=1`;

    // 创建 Checkout Session（核心：参数类型全部为 string，且包含必需字段）
    const session = await stripe.checkout.sessions.create({
      mode: isSub ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // 这里的 metadata 是加在 Session 上的；如需把 metadata 透传到订阅，可再补 subscription_data.metadata
      metadata: {
        price_id: priceId,
        plan,
      },
    });

    return NextResponse.json(
      { id: session.id, url: session.url },
      { status: 200 },
    );
  } catch (err: any) {
    // 对 Stripe/API 错误做兜底
    return NextResponse.json(
      {
        error: err?.message ?? 'Failed to create checkout session',
      },
      { status: 500 },
    );
  }
}
