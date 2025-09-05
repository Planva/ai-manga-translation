// app/(dashboard)/layout.tsx
export const runtime = 'edge';

import { SWRConfig } from 'swr';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/user': getUser(),        // 服务端取数
          '/api/team': getTeamForUser(), // 服务端取数
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
