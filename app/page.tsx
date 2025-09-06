// app/page.tsx — 纯 SSR 首页（Edge Runtime）
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { headers } from 'next/headers';

async function get<T>(path: string): Promise<T | null> {
  const host = headers().get('host');
  const base = `https://${host}`;
  try {
    const res = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function Home() {
  // 这些都是在服务端取数据，渲染成 HTML 输出，没有任何前端水合依赖
  const user = await get<{ email?: string }>('/api/user');
  const wallet = await get<{ balance: number }>('/api/wallet/summary');

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-3xl font-semibold mb-3">AI Manga Translation</h1>
        <p className="text-base opacity-80">
          这是一个纯后端渲染的首页（无前端 JS）。你可以安全地浏览、登录与查看余额。
        </p>

        <div className="mt-6 grid gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-block rounded-lg border px-4 py-2"
          >
            定价 / 充值
          </Link>
          <Link
            href="/sign-in"
            className="inline-block rounded-lg border px-4 py-2"
          >
            登录
          </Link>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg border px-4 py-2"
          >
            打开工作台（含必要的前端交互）
          </Link>
        </div>

        <div className="mt-8 text-sm opacity-80">
          <div>当前用户：{user?.email ?? '未登录'}</div>
          {wallet && <div>余额：{wallet.balance}</div>}
        </div>
      </div>
    </main>
  );
}
