// app/api/stripe/webhook/route.ts
export const runtime = 'edge';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { FALLBACK_PRICE_META } from '@/lib/pay/prices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ----------------------- credits helpers ----------------------- */

function creditsFromPriceOrProduct(price: Stripe.Price | null): number {
  if (!price) return 0;

  const recurring = !!price.recurring; // 该价目是否属于订阅（有 recurring）

  const md: any = price.metadata || {};
  const prodMd: any =
    price.product && typeof price.product === 'object'
      ? (price.product as any).metadata || {}
      : {};

  // 订阅优先读 credits_per_cycle；一次性优先读 credits
  const candidate =
    recurring
      ? (md.credits_per_cycle ?? prodMd.credits_per_cycle ?? md.credits ?? prodMd.credits)
      : (md.credits ?? prodMd.credits ?? md.credits_per_cycle ?? prodMd.credits_per_cycle);

  const fromMeta = Number(candidate);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return Math.floor(fromMeta);

  // 兜底：FALLBACK_PRICE_META 既支持 number，也支持 { credits } / { credits_per_cycle }
  const fb: any = (FALLBACK_PRICE_META as any)[price.id ?? ''];
  if (fb != null) {
    if (typeof fb === 'number') return Math.floor(fb);
    const n = Number(
      recurring
        ? (fb.credits_per_cycle ?? fb.credits)
        : (fb.credits ?? fb.credits_per_cycle)
    );
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }

  return 0;
}


async function calcCheckoutCredits(session: Stripe.Checkout.Session): Promise<number> {
  const explicit = Number((session.metadata as any)?.credits);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price.product'],
  });
  const items = full.line_items?.data ?? [];
  let total = 0;
  for (const li of items) {
    const qty = li.quantity ?? 1;
    const price = li.price as Stripe.Price | null;
    const per = creditsFromPriceOrProduct(price);
    // 调试：看看是哪个价没识别到
    console.log('[webhook][checkout] line', {
      priceId: price?.id,
      productId: typeof price?.product === 'object' ? (price!.product as any)?.id : price?.product,
      per,
      qty,
    });
    total += per * qty;
  }
  return total;
}

async function calcInvoiceCredits(invoice: Stripe.Invoice): Promise<number> {
  const inv = await stripe.invoices.retrieve(invoice.id, {
    expand: ['lines.data.price.product'],
  });
  let total = 0;
  for (const li of inv.lines.data) {
    const qty = li.quantity ?? 1;
    const price = li.price as Stripe.Price | null;
    const per = creditsFromPriceOrProduct(price);
    console.log('[webhook][invoice] line', {
      priceId: price?.id,
      productId: typeof price?.product === 'object' ? (price!.product as any)?.id : price?.product,
      per,
      qty,
    });
    total += per * qty;
  }
  if (total > 0) return total;

  // 行项目没有识别到积分，回退到订阅主项
  const sid =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : (invoice.subscription as any)?.id;
  if (!sid) return 0;

  const sub = await stripe.subscriptions.retrieve(sid, {
    expand: ['items.data.price.product'],
  });
  const item = sub.items.data[0];
  const price = (item?.price as Stripe.Price) ?? null;
  const qty = item?.quantity ?? 1;
  const per = creditsFromPriceOrProduct(price);

  console.log('[webhook][invoice] fallback subscription item', {
    priceId: price?.id,
    productId: typeof price?.product === 'object' ? (price!.product as any)?.id : price?.product,
    per,
    qty,
  });

  const fromSub = per * qty;
  return Number.isFinite(fromSub) && fromSub > 0 ? Math.floor(fromSub) : 0;
}

function calcPaymentIntentCredits(pi: Stripe.PaymentIntent): number {
  const m = Number((pi.metadata as any)?.credits);
  return Number.isFinite(m) && m > 0 ? Math.floor(m) : 0;
}

/* ----------------------- user helpers ----------------------- */

async function userIdFromNumberOrEmail(v: any): Promise<number | null> {
  const n = Number(v);
  if (Number.isInteger(n) && n > 0) return n;

  const s = String(v ?? '').trim();
  if (s && s.includes('@')) {
    const { data } = await supabase.from('users').select('id').eq('email', s).maybeSingle();
    return data?.id ?? null;
  }
  return null;
}

async function getUserIdFromCustomerId(customerId?: string | null): Promise<number | null> {
  if (!customerId) return null;
  try {
    const cust = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
    // 先看 metadata.app_user_id
    const mUid = (cust.metadata as any)?.app_user_id;
    const byMeta = await userIdFromNumberOrEmail(mUid);
    if (byMeta) return byMeta;

    // 再看 email
    const byEmail = await userIdFromNumberOrEmail(cust.email);
    if (byEmail) return byEmail;
  } catch {}
  return null;
}

/**
 * 🔁 关键顺序（专为 invoice 调整）：
 *  1) Subscription.metadata.userId
 *  2) Customer.metadata.app_user_id
 *  3) Invoice.metadata.userId
 *  4) Customer.email / Invoice.customer_email
 */
async function resolveUserIdFromInvoice(inv: Stripe.Invoice): Promise<number | null> {
  const sid =
    typeof inv.subscription === 'string' ? inv.subscription : (inv.subscription as any)?.id;
  if (sid) {
    try {
      const sub = await stripe.subscriptions.retrieve(sid);
      const fromSubMeta = await userIdFromNumberOrEmail(
        (sub.metadata as any)?.userId ?? (sub.metadata as any)?.user_id
      );
      if (fromSubMeta) return fromSubMeta;
    } catch {}
  }

  const cid =
    typeof inv.customer === 'string' ? inv.customer : (inv.customer as any)?.id;
  const byCustomer = await getUserIdFromCustomerId(cid);
  if (byCustomer) return byCustomer;

  const byInvMeta = await userIdFromNumberOrEmail(
    (inv.metadata as any)?.userId ?? (inv.metadata as any)?.user_id
  );
  if (byInvMeta) return byInvMeta;

  const byEmail = await userIdFromNumberOrEmail(inv.customer_email);
  if (byEmail) return byEmail;

  return null;
}

async function resolveUserIdFromCheckout(session: Stripe.Checkout.Session): Promise<number | null> {
  const direct =
    (session.metadata as any)?.userId ??
    (session.metadata as any)?.user_id ??
    session.client_reference_id ??
    session.customer_details?.email ??
    (session as any).customer_email;
  const fromDirect = await userIdFromNumberOrEmail(direct);
  if (fromDirect) return fromDirect;

  const cid = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id;
  return await getUserIdFromCustomerId(cid);
}

async function resolveUserIdFromPaymentIntent(pi: Stripe.PaymentIntent): Promise<number | null> {
  const direct =
    (pi.metadata as any)?.userId ??
    (pi.metadata as any)?.user_id ??
    (pi.metadata as any)?.email;
  const fromDirect = await userIdFromNumberOrEmail(direct);
  if (fromDirect) return fromDirect;

  const cid = typeof pi.customer === 'string' ? pi.customer : (pi.customer as any)?.id;
  return await getUserIdFromCustomerId(cid);
}

/* ----------------------- wallet helpers ----------------------- */

async function addCreditsIncrement(
  uid: number,
  delta: number,
  reason: 'pack_purchase' | 'subscription_cycle' | string,
  externalId?: string,
  meta?: any
) {
  if (!Number.isFinite(delta) || delta <= 0) return;

  const { error: ledgerErr } = await supabase.from('credit_ledger').insert({
    user_id: uid,
    delta,
    reason,
    external_id: externalId ?? null,
  } as any);
  if (ledgerErr) {
    console.error('[webhook] credit_ledger insert error:', ledgerErr.message, {
      uid,
      delta,
      reason,
      externalId,
      meta,
    });
    return;
  }

  const { data: walletRow, error: selErr } = await supabase
    .from('credit_wallet')
    .select('balance')
    .eq('user_id', uid)
    .maybeSingle();
  if (selErr) {
    console.error('[webhook] credit_wallet select error:', selErr.message, { uid });
    return;
  }

  const nextBalance = Number(walletRow?.balance ?? 0) + Number(delta || 0);

  const { error: upsertErr } = await supabase
    .from('credit_wallet')
    .upsert(
      { user_id: uid, balance: nextBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (upsertErr) {
    console.error('[webhook] credit_wallet upsert error:', upsertErr.message, {
      uid,
      nextBalance,
    });
  }
}

// 只在 Stripe Customer 写 app_user_id（你 users 表没有 stripe_customer_id 列）
async function bindCustomerToUser(uid: number, customerId?: string | null) {
  if (!customerId) return;
  try {
    await stripe.customers.update(customerId, { metadata: { app_user_id: String(uid) } });
  } catch (e: any) {
    console.error('[webhook] stripe.customers.update metadata error:', e?.message, {
      customerId,
      uid,
    });
  }
}

/* ----------------------------- webhook ----------------------------- */

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
      undefined,
      cryptoProvider
    );
  } catch (err: any) {
    console.error('[webhook] signature error:', err?.message);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = await resolveUserIdFromCheckout(session);
        const mode = session.mode;
        const cid =
          typeof session.customer === 'string'
            ? session.customer
            : (session.customer as any)?.id;

        console.log('[webhook] checkout.session.completed', {
          uid,
          mode,
          sid: session.id,
          cid,
        });

        if (uid) {
          // 是否在首单就发放一次（按你的业务决定；保留可让用户立即看到额度）
          const credits = await calcCheckoutCredits(session);
          console.log('[webhook] checkout credits', { uid, credits });
          if (credits > 0) {
            await addCreditsIncrement(uid, credits, 'pack_purchase', session.id, {
              source: 'checkout',
              mode,
            });
          }
          await bindCustomerToUser(uid, cid);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        const uid = await resolveUserIdFromInvoice(invoice);
        const sid =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : (invoice.subscription as any)?.id;

        console.log('[webhook] invoice.payment_succeeded', {
          uid,
          invoice: invoice.id,
          subscription: sid,
        });

        if (uid) {
          const credits = await calcInvoiceCredits(invoice);
          console.log('[webhook] invoice credits', { uid, credits });
          if (credits > 0) {
            await addCreditsIncrement(uid, credits, 'subscription_cycle', invoice.id, {
              source: 'invoice',
              subscription: sid,
            });
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const uid = await resolveUserIdFromPaymentIntent(pi);
        const credits = calcPaymentIntentCredits(pi);
        console.log('[webhook] payment_intent.succeeded', { uid, credits, pi: pi.id });
        if (uid && credits > 0) {
          await addCreditsIncrement(uid, credits, 'pack_purchase', pi.id, {
            source: 'payment_intent',
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[webhook] handler error:', err?.message || err);
    return NextResponse.json({ ok: true });
  }
}
