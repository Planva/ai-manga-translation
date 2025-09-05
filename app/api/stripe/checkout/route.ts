// app/api/stripe/checkout/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(), // Edge 兼容
});

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false }, global: { fetch } }
);

// 尝试把对象按 camelCase 或 snake_case 两种形态都准备好（自动择一）
function buildTeamUpdate(
  shape: 'camel' | 'snake',
  v: {
    customerId: string;
    subscriptionId: string;
    productId: string | null;
    displayName: string | null;
    status: Stripe.Subscription.Status;
  }
) {
  if (shape === 'camel') {
    return {
      stripeCustomerId: v.customerId,
      stripeSubscriptionId: v.subscriptionId,
      stripeProductId: v.productId,
      planName: v.displayName,
      subscriptionStatus: v.status,
      updatedAt: new Date().toISOString(),
    };
  }
  // snake
  return {
    stripe_customer_id: v.customerId,
    stripe_subscription_id: v.subscriptionId,
    stripe_product_id: v.productId,
    plan_name: v.displayName,
    subscription_status: v.status,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return NextResponse.redirect(new URL('/pricing', request.url));

    // 1) 取 Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    // 取 userId（你在创建 Checkout 时已设置 client_reference_id）
    const userId = Number(session.client_reference_id);
    if (!Number.isInteger(userId)) {
      throw new Error('Invalid client_reference_id on Checkout Session');
    }

    // 2) 取 customer/subscription
    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer on Checkout Session');
    }
    const customerId = session.customer.id;

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('No subscription found on Checkout Session');
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price', 'items.data.price.product'],
    });
    const item = sub.items.data[0];
    const price = item?.price as Stripe.Price | undefined;

    const displayName =
      (price?.nickname as string | null | undefined) ??
      (typeof price?.product === 'object'
        ? (price?.product as Stripe.Product).name
        : null);

    const productId =
      typeof price?.product === 'string'
        ? price.product
        : (price?.product as Stripe.Product | undefined)?.id ?? null;

    // 3) 绑定 Stripe Customer metadata.app_user_id（方便后续查询）
    try {
      await stripe.customers.update(customerId, {
        metadata: { app_user_id: String(userId) },
      });
    } catch (e) {
      // 非致命，忽略
      console.warn('[checkout] set customer metadata failed:', e);
    }

    // 4) 查 team_id（team_members.user_id -> team_id）
    const { data: link, error: linkErr } = await supa
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (linkErr) throw linkErr;
    if (!link?.team_id) throw new Error('User not in any team');

    const teamId = link.team_id;

    // 5) 读取 teams 当前一行，探测列名风格
    const { data: teamRow, error: rowErr } = await supa
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();
    if (rowErr) throw rowErr;
    if (!teamRow) throw new Error('Team not found');

    const isCamel =
      'stripeCustomerId' in teamRow ||
      'planName' in teamRow ||
      'subscriptionStatus' in teamRow;

    const shape: 'camel' | 'snake' = isCamel ? 'camel' : 'snake';

    // 6) 更新 teams 订阅字段（自动选择风格）
    const updateObj = buildTeamUpdate(shape, {
      customerId,
      subscriptionId,
      productId,
      displayName,
      status: sub.status,
    });

    const { error: updErr } = await supa.from('teams').update(updateObj).eq('id', teamId);
    if (updErr) throw updErr;

    // 7) 也顺便把 users.stripeCustomerId 写上（同样自动风格）
    try {
      const { data: userRow } = await supa
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userRow) {
        const usersCamel = 'stripeCustomerId' in userRow;
        const usersUpdate = usersCamel
          ? { stripeCustomerId: customerId, updatedAt: new Date().toISOString() }
          : { stripe_customer_id: customerId, updated_at: new Date().toISOString() };

        await supa.from('users').update(usersUpdate).eq('id', userId);
      }
    } catch (e) {
      console.warn('[checkout] update users.stripeCustomerId failed:', e);
    }

    // 成功 -> /dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url), { status: 303 });
  } catch (err: any) {
    console.error('[edge/api/stripe/checkout] error:', err?.stack || err);
    return NextResponse.redirect(
      new URL(`/error?code=checkout_handle_failed&msg=${encodeURIComponent(err?.message || 'unknown')}`, request.url),
      { status: 303 }
    );
  }
}
