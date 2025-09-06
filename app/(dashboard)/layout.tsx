// app/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import SiteHeader from '@/components/site-header';
import SiteFooter from "@/components/SiteFooter";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <SiteHeader />
      {children}
      <SiteFooter />
    </section>
  );
}
