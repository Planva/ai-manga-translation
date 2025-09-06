'use client';

// 复用现有首页
import Home from './(dashboard)/page';
// 复用你的站点头部（如果希望首页也有同样的导航）
import SiteHeader from '@/components/site-header';

export const dynamic = 'force-dynamic'; // 避免被静态化导致拿不到运行时数据

export default function IndexPage() {
  return (
    <>
      <SiteHeader />
      <Home />
    </>
  );
}
