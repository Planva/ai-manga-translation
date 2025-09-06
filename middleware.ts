// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

// 只拦 /dashboard 及其子路径；根路径 "/" 不拦
export const config = {
  matcher: [
    // 只对 dashboard 下的页面做鉴权
    '/dashboard/:path*',
    '/api/:path*'
    // 如果你还有其它需要保护的区段，继续加
    // '/api/private/:path*',
  ],
};

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 跳过 Next 静态资源、已知文件以及 webhook
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 只在受保护区段检查会话
  try {
    const { getSession } = await import('@/lib/auth/session');
    const session = await getSession();

    if (!session?.user?.id) {
      const url = new URL('/sign-in', req.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  } catch {
    // 出错也不要把请求吃掉，正常放行避免空响应
    return NextResponse.next();
  }

  return NextResponse.next();
}
