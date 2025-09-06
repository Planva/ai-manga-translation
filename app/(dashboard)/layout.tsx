// app/(dashboard)/layout.tsx
'use client'
export const runtime = 'edge';

import SiteHeader from '@/components/site-header';
import SiteFooter from "@/components/SiteFooter";
import { SWRConfig } from 'swr';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{}}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </SWRConfig>
  );
}
