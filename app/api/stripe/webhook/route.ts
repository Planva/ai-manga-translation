// app/api/stripe/webhook/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!SECRET) throw new Error('Missing STRIPE_SECRET_KEY');
if (!WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

// Edge 兼容：仅保留 fetch http client（不要再写 apiVersion）
const stripe = new Stripe(SECRET, {
  httpClient: Stripe.createFetchHttpClient(),
});

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    // Webhook 需要原始文本
    const body = await req.text();

    // ✅ 正确用法：把 subtle crypto 作为 constructEventAsync 的第 5 个参数
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
      undefined,        // 可选 tolerance，保持默认
      cryptoProvider
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // TODO: 标记支付成功 / 开通订阅或配额
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        // TODO: 同步订阅状态到数据库
        break;
      }
      default:
        // 其他事件按需处理
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Webhook error' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
