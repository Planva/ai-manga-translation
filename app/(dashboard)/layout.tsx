// app/(dashboard)/layout.tsx
export const runtime = 'edge';

import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/SiteFooter';
import { SWRConfig } from 'swr';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ 关键：不要把 Promise 直接传给 SWRConfig
  let user: any = null;
  let team: any = null;

  try {
    // 并发取数，兼容 edge
    [user, team] = await Promise.all([getUser(), getTeamForUser()]);
  } catch {
    // 兜底：失败就给 null，避免渲染阶段抛错
    user = null;
    team = null;
  }

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/user': user,
          '/api/team': team,
        },
      }}
    >
      <SiteHeader />
      {children}
      <SiteFooter />
    </SWRConfig>
  );
}
