'use client';

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';

/** 放到最前，避免“Cannot access 'fetcher' before initialization” */
const fetcher = (url: string) => fetch(url).then((r) => r.json());
const formatDate = (unixSec?: number | null) =>
  !unixSec ? '—' : new Date(unixSec * 1000).toLocaleDateString();

/** 订阅信息（自动读取 /api/billing/subscription） */
function SubscriptionInfo() {
  const { data: sub, isLoading, error, mutate } = useSWR(
    '/api/billing/subscription',
    fetcher,
    { revalidateOnFocus: true }
  );

  // 从 Portal 返回 ?portal=1 时，强制刷新一次
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('portal') === '1') mutate();
  }, [mutate]);

  const current = sub?.current ?? null;
  const planName = current?.display_name ?? 'Free';
  const interval = current?.interval ? `Billed ${current.interval}` : '—';
  const isCanceled = current?.cancel_at_period_end === true;
  const endsAt = current?.ends_at ?? current?.current_period_end ?? null;

  return (
    <>
      <div className="text-sm text-white/80">Subscription</div>

      {/* 1) 加载态 */}
      {isLoading ? (
        <>
          <div className="mt-2 text-base"><span className="font-medium">—</span></div>
          <div className="text-xs text-white/65">—</div>
        </>
      ) : null}

      {/* 2) 无订阅：current === null → 显示 Free */}
      {!isLoading && !current ? (
        <>
          <div className="mt-2 text-base">
            Current Plan: <span className="font-medium">Free</span>
          </div>
          <div className="text-xs text-white/65">—</div>
        </>
      ) : null}

      {/* 3) 有订阅：展示计划与周期 */}
      {!isLoading && current ? (
        <>
          <div className="mt-2 text-base">
            Current Plan: <span className="font-medium">{planName}</span>
          </div>
          <div className="text-xs text-white/65">{interval}</div>

          {/* 4) 取消提示：cancel_at_period_end === true */}
          {isCanceled && (
            <div className="mt-1 text-xs text-amber-300/90">
              Cancelled,Will expire at {formatDate(endsAt)}
            </div>
          )}
        </>
      ) : null}

      <Link
        href="/api/billing/portal"
        className="mt-3 inline-block rounded-lg border border-white/12 bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/14"
      >
        Manage Subscription
      </Link>

      {error ? (
        <div className="mt-2 text-xs text-red-400">Failed to load subscription.</div>
      ) : null}
    </>
  );
}

/** 购买额度（从 /api/wallet/summary 读取 credit_wallet.balance） */
function CreditsRemaining() {
  const { data, isLoading } = useSWR('/api/wallet/summary', fetcher);
  const balance: number = data?.balance ?? 0;

  return (
    <div className="mb-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="opacity-80">Purchased credits remaining</span>
        <span className="font-medium">{isLoading ? '—' : balance}</span>
      </div>
    </div>
  );
}

/** 页面主体 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
      </header>

      {/* 订阅卡片（真实订阅 + Stripe Portal 按钮） */}
      <section className="rounded-xl border border-white/10 bg-black/20 p-4">
        <SubscriptionInfo />
      </section>

      {/* 成员卡片（仅保留你本人 + 显示余额） */}
      <section className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="mb-4 text-sm text-white/80">Team Members</div>
        <CreditsRemaining />
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3">
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="text-sm text-white/90">You</div>
        </div>
      </section>
    </div>
  );
}
