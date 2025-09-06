'use client';
export const runtime = 'edge';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard',          icon: Users,    label: 'Team' },
    { href: '/dashboard/general',  icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield,   label: 'Security' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Mobile 顶部：仅放一个抽屉按钮（玻璃态） */}
      <div className="lg:hidden sticky top-[56px] z-30 mt-3 mb-3">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
          <span className="text-sm font-medium">Settings</span>
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => setIsSidebarOpen((s) => !s)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/10 hover:bg-white/14"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 主体区域：左侧玻璃态侧栏 + 右侧内容 */}
      <div className="relative flex gap-6 pb-10">
        {/* Sidebar */}
        <aside
          className={`
            ${isSidebarOpen ? 'block' : 'hidden'} 
            lg:block shrink-0 w-64
            rounded-2xl border border-white/10 bg-white/5 backdrop-blur
            shadow-[0_10px_30px_rgba(0,0,0,.35)] p-3
            lg:sticky lg:top-[96px] lg:self-start
            z-40
          `}
        >
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={[
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    active
                      ? 'bg-[rgba(129,140,248,.18)] ring-1 ring-indigo-400/40'
                      : 'hover:bg-white/8 hover:ring-1 hover:ring-white/10',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 右侧内容（由各个 page.tsx 渲染） */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
