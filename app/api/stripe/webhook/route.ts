// app/api/stripe/webhook/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { addCreditsToUser } from '@/lib/billing/credit';
import { requireDb } from '@/lib/db';
import { sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

/** 若某些价格没配置 metadata.credits，可在这里写兜底映射 */
const FALLBACK_PRICE_META: Record<string, number> = {
  // 'price_XXXXX': 1200,
  // 'price_YYYYY': 300,
};

/** 把任意 user 标识解析为 users.id（number），支持数字/邮箱 */
async function resolveNumericUserId(userIdRaw: any): Promise<number> {
  const n = Number(userIdRaw);
  if (Number.isInteger(n) && n > 0) return n;

  const v = String(userIdRaw ?? '').trim();
  if (v && v.includes('@')) {
    const db = requireDb();
    const r: any = await db.execute(sql`select id from users where email = ${v} limit 1`);
    const id = r?.rows?.[0]?.id;
    if (Number.isInteger(id)) return id as number;
    throw new Error(`Cannot resolve user by email: ${v}`);
  }
  throw new Error(`Cannot resolve numeric user id from "${userIdRaw}"`);
}

/** 统一拿用户身份：Checkout/Invoice/PI 均可 */
function extractIdentity(obj: Stripe.Checkout.Session | Stripe.Invoice | Stripe.PaymentIntent) {
  // Checkout Session
  if ((obj as any).object === 'checkout.session') {
    const s = obj as Stripe.Checkout.Session;
    const md = (s.metadata || {}) as Record<string, any>;
    return (
      md.userId ?? md.user_id ?? md.userid ?? md.uid ??
      s.customer_details?.email ?? (s as any).customer_email
    );
  }
  // Invoice
  if ((obj as any).object === 'invoice') {
    const inv = obj as Stripe.Invoice;
    const md = (inv.metadata || {}) as Record<string, any>;
    return (
      md.userId ?? md.user_id ?? md.userid ?? md.uid ??
      inv.customer_email ?? (inv.customer as string)
    );
  }
  // PaymentIntent
  const pi = obj as Stripe.PaymentIntent;
  const md = (pi.metadata || {}) as Record<string, any>;
  return md.userId ?? md.user_id ?? md.userid ?? md.uid ?? md.email;
}

/** 从 Price / Product / FALLBACK 中拿“每件积分” */
function creditsFromPriceOrProduct(price: Stripe.Price | null): number {
  if (!price) return 0;
  const byPrice = Number((price.metadata as any)?.credits);
  if (Number.isFinite(byPrice) && byPrice > 0) return Math.floor(byPrice);

  // 有些项目把 credits 放 Product
  const prodMeta = (price.product && typeof price.product === 'object')
    ? (price.product as Stripe.Product).metadata
    : undefined;
  const byProduct = Number((prodMeta as any)?.credits);
  if (Number.isFinite(byProduct) && byProduct > 0) return Math.floor(byProduct);

  const fallback = FALLBACK_PRICE_META[price.id ?? ''];
  return Number.isFinite(fallback) && fallback > 0 ? Math.floor(fallback) : 0;
}

/** 计算 Checkout（一次性）总积分 */
async function calcCheckoutCredits(session: Stripe.Checkout.Session): Promise<number> {
  // 1) session.metadata.credits 明确指定
  const m = Number((session.metadata as any)?.credits);
  if (Number.isFinite(m) && m > 0) return Math.floor(m);

  // 2) 展开价格与产品，读取 price/product metadata 或兜底映射
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price.product'],
  });
  const items = full.line_items?.data ?? [];
  let total = 0;
  for (const li of items) {
    const qty = li.quantity ?? 1;
    const price = li.price as Stripe.Price | null;
    const per = creditsFromPriceOrProduct(price);
    if (per > 0) total += per * qty;
  }
  return total;
}

/** 计算 Invoice（订阅周期 + 可能的临时一次性项）总积分 */
async function calcInvoiceCredits(invoice: Stripe.Invoice): Promise<number> {
  const inv = await stripe.invoices.retrieve(invoice.id, {
    expand: ['lines.data.price.product'],
  });
  let total = 0;
  for (const li of inv.lines.data) {
    const qty = li.quantity ?? 1;
    const price = li.price as Stripe.Price | null;
    const per = creditsFromPriceOrProduct(price);
    if (per > 0) total += per * qty;
  }
  return total;
}

/** 计算 PI（无 Checkout 的一口价）积分：只能靠 metadata.credits */
function calcPaymentIntentCredits(pi: Stripe.PaymentIntent): number {
  const m = Number((pi.metadata as any)?.credits);
  return Number.isFinite(m) && m > 0 ? Math.floor(m) : 0;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;

  try {
    const raw = await req.text(); // 保留原始 body
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    console.error('[stripe/webhook] signature error:', err?.message);
    // 仍返回 200，避免 Stripe 重试风暴（需要重试可改 400/500）
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      /** 一次性购买（Checkout） */
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const identity = extractIdentity(session);
        if (!identity) break;

        const uid = await resolveNumericUserId(identity);
        const credits = await calcCheckoutCredits(session);

        if (credits > 0) {
          await addCreditsToUser(uid, credits, 'pack_purchase', session.id, {
            source: 'checkout',
            mode: session.mode,
          });
        }
        break;
      }

      /** 订阅账单支付成功（每期 + 可能的临时一次性项） */
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const identity = extractIdentity(invoice);
        if (!identity) break;

        const uid = await resolveNumericUserId(identity);
        const credits = await calcInvoiceCredits(invoice);

        if (credits > 0) {
          await addCreditsToUser(uid, credits, 'subscription_cycle', invoice.id, {
            source: 'invoice',
            subscription: invoice.subscription,
          });
        }
        break;
      }

      /** 未走 Checkout 的一口价（比如 Payment Links / 自建 PI） */
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const identity = extractIdentity(pi);
        if (!identity) break;

        const uid = await resolveNumericUserId(identity);
        const credits = calcPaymentIntentCredits(pi);

        if (credits > 0) {
          await addCreditsToUser(uid, credits, 'pack_purchase', pi.id, {
            source: 'payment_intent',
          });
        }
        break;
      }

      default:
        // 忽略其他事件
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[stripe/webhook] handler error:', err);
    // 保持 200，避免 Stripe 无限重试；如需重试可改 500
    return NextResponse.json({ ok: true });
  }
}
