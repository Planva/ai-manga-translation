// app/(marketing)/page.tsx
export const runtime = 'edge';           // Cloudflare 友好
export const dynamic = 'force-static';   // 首页可静态化（可选）

export default async function Home() {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">AI Manga Translation</h1>
        <p className="text-slate-400">这是一个纯后端渲染的首页（无前端 JS）。你可以安全地浏览、登录与查看余额。</p>
        <div className="space-x-3">
          <a href="/pricing" className="border px-4 py-2 rounded">定价 / 充值</a>
          <a href="/sign-in" className="border px-4 py-2 rounded">登录</a>
          <a href="/dashboard" className="border px-4 py-2 rounded">打开平台</a>
        </div>
      </div>
    </main>
  );
}
