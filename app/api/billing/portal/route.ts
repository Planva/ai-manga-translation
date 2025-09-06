// app/api/billing/portal/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 动态导入，避免构建期执行
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

    // 在 Edge/Workers 环境使用 fetch http client（如果可用）
    // @ts-ignore - 运行时存在该方法
    const stripe = new Stripe(apiKey, {
      // 一些环境下没有该方法，做可选调用
      httpClient: (Stripe as any).createFetchHttpClient?.(),
      // 不显式设置 apiVersion，避免 TS 字面量校验问题
    });

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 解析/获取 customerId（放到 handler 内，避免顶层 await/env）
    const resolveCustomerId = async (): Promise<string | null> => {
      const fromUser =
        (user as any).stripe_customer_id ??
        (user as any).stripeCustomerId ??
        null;
      if (fromUser) return fromUser;

      if ((user as any).email) {
        const list = await stripe.customers.list({
          email: (user as any).email,
          limit: 1,
        });
        if (list.data.length > 0) return list.data[0]!.id;
      }
      return null;
    };

    const customerId = await resolveCustomerId();
    if (!customerId) {
      return NextResponse.json(
        { error: 'Stripe customer not found for current user.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/dashboard?portal=1`,
    });

    // 重定向到 Stripe Billing Portal
    return NextResponse.redirect(portal.url, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[billing/portal] error:', e?.stack || e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
