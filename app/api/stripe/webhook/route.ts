// app/api/stripe/webhook/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1) 动态导入 Stripe，避免构建期读取 env
    const { default: Stripe } = await import('stripe');

    // 2) 取密钥（在函数里），缺失就返回 500
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 });
    }

    // 3) 用 fetch http client 以兼容 Edge / Workers
    const stripe = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
      // 不手动指定 apiVersion，避免 basil 类型冲突
    });

    // 4) 读取签名与“原始文本”请求体
    const signature =
      req.headers.get('stripe-signature') || req.headers.get('Stripe-Signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }
    const body = await req.text();

    // 5) 用 WebCrypto 校验（Edge 友好）
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    // 6) 业务处理（这里不引用 Stripe 类型，避免类型值引入）
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        // TODO: 标记支付成功 / 开通订阅或额度（可异步丢到队列）
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        // TODO: 同步订阅状态到数据库
        break;
      }
      default:
        // 可选：记录一下未覆盖事件
        // console.log('[stripe/webhook] unhandled:', event.type);
        break;
    }

    return NextResponse.json(
      { received: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[stripe/webhook] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Webhook error' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

// 方便健康探活
export async function GET() {
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
