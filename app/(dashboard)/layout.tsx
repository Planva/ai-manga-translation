export const runtime = 'edge';

import { Suspense } from 'react';
import { SWRConfig } from 'swr';
import SiteHeader from '@/components/site-header';
import GradientBackground from '@/components/gradient-background';
import { getSession } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  // 仅当已登录时才做 SSR 预取，匿名用户直接跳过，避免不必要的服务端调用
  let fallback: Record<string, any> = {};
  try {
    const session = await getSession();
    if (session?.user?.id) {
      const [{ getUser, getTeamForUser }] = await Promise.all([
        import('@/lib/db/queries'),
      ]);
      const [user, team] = await Promise.all([getUser(), getTeamForUser()]);
      fallback = {
        '/api/user': user,
        '/api/team': team,
      };
    }
  } catch {
    // 忽略预取失败，交给客户端 SWR 自己拉
  }

  return (
    <SWRConfig value={{ fetcher: (u: string) => fetch(u).then(r => r.json()), fallback }}>
      <div className="relative min-h-screen w-full overflow-hidden">
        <GradientBackground />
        <div className="relative z-10">
          <Suspense fallback={<div />}>
            <SiteHeader />
          </Suspense>
          {children}
        </div>
      </div>
    </SWRConfig>
  );
}
