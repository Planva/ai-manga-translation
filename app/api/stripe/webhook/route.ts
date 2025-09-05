// app/api/stripe/webhook/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!SECRET) throw new Error('Missing STRIPE_SECRET_KEY');
if (!WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

// Edge 兼容：使用 fetch http client + SubtleCrypto
const stripe = new Stripe(SECRET, {
  // 不写 apiVersion，避免和类型锁冲突
  httpClient: Stripe.createFetchHttpClient(),
  cryptoProvider: Stripe.createSubtleCryptoProvider(),
});

export async function POST(req: Request) {
  try {
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    // Webhook 必须用原始字符串
    const body = await req.text();

    // 使用 async + subtle crypto 验证签名（Edge）
    const event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      WEBHOOK_SECRET
    );

    // === 依据事件类型分支（按需扩展你的业务逻辑） ===
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // TODO: 标记用户付费成功、开通订阅/配额等
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        // TODO: 同步订阅状态到你的数据库
        break;
      }
      default:
        // 其他事件按需处理
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    // Stripe 校验失败或者解析失败
    return NextResponse.json(
      { error: err?.message ?? 'Webhook error' },
      { status: 400 }
    );
  }
}

// 可选：GET 用于健康检查
export async function GET() {
  return NextResponse.json({ ok: true });
}
