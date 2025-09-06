'use client';

import { useState } from 'react';
import { STRIPE_PRICES } from '@/lib/pay/prices';

/** 发起结账（保持你原来的逻辑不变） */
async function startCheckout(priceId: string, setBusy: (v: boolean) => void) {
  try {
    setBusy(true);
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    if (r.status === 401) {
      alert('Please login first.');
      return;
    }
    if (!r.ok) {
      const t = await r.text();
      alert(t || 'Failed to start checkout');
      return;
    }

    const { url } = await r.json();
    if (url) window.location.href = url;
  } catch (e: any) {
    alert(e?.message || String(e));
  } finally {
    setBusy(false);
  }
}

export default function PricingPage() {
  const [busy, setBusy] = useState(false);

  /** ===== 默认选中设置（按需改这三行） =====
   * 默认显示哪个 Tab：'oneoff' | 'sub'
   * 默认订阅选择：'month' | 'year'
   * 默认一次性选择：'starter' | 'standard' | 'bulk'  （中间套餐 standard）
   */
  const [mode, setMode] = useState<'oneoff' | 'sub'>('sub');
  const [cycle, setCycle] = useState<'month' | 'year'>('year');
  const [pack, setPack] = useState<'starter' | 'standard' | 'bulk'>('standard');
  /* ---- savings calcs (based on the numbers shown on cards) ---- */
  // Packs: Starter baseline
  const unitStarter = 6.90 / 300;
  const unitStandard = 19.90 / 1000;
  const unitBulk = 24.90 / 1200;
  const saveStandardPct = Math.round((1 - unitStandard / unitStarter) * 100); // 13
  const saveBulkPct = Math.round((1 - unitBulk / unitStarter) * 100);         // 10

  // Subs: Monthly baseline (using your screenshot: $19.90 / 1200 vs $199.9 / 16000)
  const unitMonthly = 19.90 / 1200;
  const unitYearly = 199.9 / 16000;
  const saveYearlyPct = Math.round((1 - unitYearly / unitMonthly) * 100);     // 25

  /** 公共的小工具：选中态样式 */
  const cardClass = (selected: boolean) =>
    [
      'bt-card p-6 text-left transition relative',
      selected
        ? 'bt-card--selected ring-2 ring-rose-400/60 shadow-[0_16px_40px_rgba(244,63,94,.35)]'
        : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5',
    ].join(' ');
  
    function SaveBadge({ value }: { value: number }) {
      if (!Number.isFinite(value) || value <= 0) return null; // 非正值不显示
      return (
        <span
          className="
            inline-flex items-center justify-center
            h-6 rounded-full px-2 text-[11px] font-semibold
            bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white/95
            shadow-[0_6px_16px_rgba(244,63,94,.35)]
          "
        >
          SAVE {value}%
        </span>
      );
    }
    
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 text-white">
      {/* 标题 */}
      <div className="text-center mb-8 sm:mb-10">
        <h1
          className="inline-block text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-transparent"
          style={{
            backgroundImage: 'linear-gradient(240deg,#fff 0%,var(--c-text) 40%,#818CF8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          Simple Pricing
        </h1>
        <p className="mt-3 text-white/80">
          Choose the plan that works for you — pay-per-use packs or monthly/yearly subscriptions.
        </p>
      </div>

      {/* 顶部模式切换（只有两种） */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-white/5 border border-white/10 backdrop-blur p-1">
          <button
            onClick={() => setMode('oneoff')}
            className={`px-4 sm:px-5 py-2 rounded-full text-sm transition ${
              mode === 'oneoff'
                ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-[0_8px_24px_rgba(244,63,94,.35)]'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Pay Per Use
          </button>
          <button
            onClick={() => setMode('sub')}
            className={`px-4 sm:px-5 py-2 rounded-full text-sm transition ${
              mode === 'sub'
                ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-[0_8px_24px_rgba(244,63,94,.35)]'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Subscription
          </button>
        </div>
      </div>

      {/* ===== 一次性购买：三卡平铺 + 底部一个按钮 ===== */}
      {mode === 'oneoff' && (
        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <button
              type="button"
              aria-pressed={pack === 'starter'}
              onClick={() => setPack('starter')}
              className={cardClass(pack === 'starter')}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">Starter Pack</div>
                {pack === 'starter' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2 text-4xl font-extrabold">$6.90</div>
              <div className="mt-1 text-xs opacity-70">≈ 300 translations</div>
              <ul className="mt-5 space-y-2 text-sm opacity-85">
                <li>✅ Priority OCR & translation pipeline</li>
                <li>✅ Multiple models (Offline, Sugoi, NLLB, M2M100, GPT-4o…)</li>
                <li>✅ Works on website and plugin</li>
                <li>✅ Credits never expire</li>
              </ul>
            </button>

            {/* Standard（默认选中） */}
            <button
              type="button"
              aria-pressed={pack === 'standard'}
              onClick={() => setPack('standard')}
              className={cardClass(pack === 'standard')}
            >
              <span className="absolute -top-3 right-4 select-none rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-[10px] font-semibold px-2 py-1 shadow">
                Popular
              </span>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">Standard Pack</div>
                {pack === 'standard' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-4xl font-extrabold">$19.90</div>
                <SaveBadge value={saveStandardPct} />
              </div>
              <div className="mt-1 text-xs opacity-70">≈ 1,000 translations</div>
              <ul className="mt-5 space-y-2 text-sm opacity-85">
                <li>✅ Faster queue & warm workers</li>
                <li>✅ Full model switch & vertical/horizontal text</li>
                <li>✅ Works on website and plugin</li>
                <li>✅ 30% off the Standard Pack</li>
                <li>✅ Credits never expire</li>
              </ul>
            </button>

            {/* Bulk */}
            <button
              type="button"
              aria-pressed={pack === 'bulk'}
              onClick={() => setPack('bulk')}
              className={cardClass(pack === 'bulk')}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">Bulk Pack</div>
                {pack === 'bulk' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-4xl font-extrabold">$24.90</div>
                <SaveBadge value={saveBulkPct} />
              </div>
              <div className="mt-1 text-xs opacity-70">≈ 1,200 translations</div>
              <ul className="mt-5 space-y-2 text-sm opacity-85">
                <li>✅ Faster queue & warm workers</li>
                <li>✅ Best unit price for heavy users</li>
                <li>✅ Same model features & quality</li>
                <li>✅ Credits never expire</li>
              </ul>
            </button>
          </div>

          {/* 底部统一按钮（一次性） */}
          <div className="mt-6 flex justify-center">
            <button
              disabled={busy}
              onClick={() =>
                startCheckout(
                  pack === 'starter'
                    ? STRIPE_PRICES.PACK_STARTER
                    : pack === 'standard'
                    ? STRIPE_PRICES.PACK_STANDARD
                    : STRIPE_PRICES.PACK_BULK,
                  setBusy
                )
              }
              className="cta w-full md:w-80"
            >
              {busy ? 'Processing…' : 'Get Started'}
            </button>
          </div>
        </section>
      )}

      {/* ===== 订阅：两卡平铺 + 底部一个按钮（默认 Yearly） ===== */}
      {mode === 'sub' && (
        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly */}
            <button
              type="button"
              aria-pressed={cycle === 'month'}
              onClick={() => setCycle('month')}
              className={cardClass(cycle === 'month')}
            >
               
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">Monthly</div>
                {cycle === 'month' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2 text-4xl font-extrabold">$19.90</div>
              <div className="mt-1 text-xs opacity-70">1,200 credits / month · rollover</div>
              <ul className="mt-5 space-y-2 text-sm opacity-85">
                <li>✅ Auto top-up every month</li>
                <li>✅ 20% increase over Pay Per Pse</li>
                <li>✅ Unused credits keep rolling</li>
                <li>✅ Cancel anytime</li>
              </ul>
            </button>

            {/* Yearly（默认选中） */}
            <button
              type="button"
              aria-pressed={cycle === 'year'}
              onClick={() => setCycle('year')}
              className={cardClass(cycle === 'year')}
            >
            
              <span className="absolute -top-3 right-4 select-none rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-[10px] font-semibold px-2 py-1 shadow">
                Best Value
              </span>
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">Yearly</div>
                {cycle === 'year' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-4xl font-extrabold">$199.9</div>
                <SaveBadge value={saveYearlyPct} />
              </div>
              <div className="mt-1 text-xs opacity-70">1,6000 credits / year · rollover</div>
              <ul className="mt-5 space-y-2 text-sm opacity-85">
                <li>✅ Best value for long-term users</li>
                <li>✅ Unused credits keep rolling</li>
                <li>✅ Better than monthly subscription</li>
                <li>✅ Cancel anytime</li>
              </ul>
            </button>
          </div>

          {/* 底部统一按钮（订阅） */}
          <div className="mt-6 flex justify-center">
            <button
              disabled={busy}
              onClick={() =>
                startCheckout(
                  cycle === 'year' ? STRIPE_PRICES.SUB_YEARLY : STRIPE_PRICES.SUB_MONTHLY,
                  setBusy
                )
              }
              className="cta w-full md:w-80"
            >
              {busy ? 'Processing…' : cycle === 'year' ? 'Subscribe Yearly' : 'Subscribe Monthly'}
            </button>
          </div>
        </section>
      )}

      {/* 安全提示 */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,.35)] p-5 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <span aria-hidden>🔒</span> Security & Privacy
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          <li>
            We only collect the minimum account data required to provide the service:
            <span className="font-medium"> email, user ID, and username</span>.
          </li>
          <li>
            Payments are processed by <span className="font-medium">Stripe</span>.
            Your card and payment details are <span className="font-medium">never stored</span> on our servers.
          </li>
          <li>You can manage or cancel your subscription anytime via the billing portal.</li>
        </ul>
      </section>

      {/* 统一卡片皮肤（不改内部业务逻辑） */}
      <style jsx>{`
        .bt-card {
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }
        .cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          width: 100%;
          height: 44px;
          background: linear-gradient(90deg, #6366f1, #a21caf);
          color: #fff;
          font-weight: 700;
          transition: transform 0.08s ease, opacity 0.2s ease;
        }
        .cta:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .bt-card--selected {
          background: rgba(255, 255, 255, 0.12);  
          border-color: rgba(255, 255, 255, 0.32);
          transform: translateY(-2px); 
        }
      `}</style>
    </main>
  );
}
