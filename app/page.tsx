// app/page.tsx
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 如果 (dashboard)/page.tsx 有导出的 metadata，顺带再导出一次
export { metadata } from './(dashboard)/page';

import DashboardHome from './(dashboard)/page';

export default function RootPage(props: any) {
  return <DashboardHome {...props} />;
}
