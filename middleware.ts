// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyToken, signToken, type SessionData } from '@/lib/auth/session';

// 需要登录才能访问的路径前缀（可按需扩展）
const PROTECTED_PREFIXES = ['/dashboard'];

// 登录/注册页路径前缀（已登录访问会被带走）
const AUTH_PREFIXES = ['/sign-in', '/sign-up'];

// 用于排除静态文件
const PUBLIC_FILE = /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|txt|map)$/i;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 跳过 API、Next 静态与优化路径、favicon 和所有静态文件
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const raw = request.cookies.get('session')?.value;
  let session: SessionData | null = null;

  if (raw) {
    try {
      session = await verifyToken(raw);
    } catch {
      session = null; // token 无效或过期
    }
  }

  const isAuthed = !!session?.user?.id;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // 已登录访问登录/注册页 -> 带到 dashboard
  if (isAuthed && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 未登录访问受保护页面 -> 去登录，并带上回跳地址
  if (!isAuthed && isProtected) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  // 处理 Cookie：失效则删除；有效则“滑动续期”（剩余 <12h 时续一天）
  if (raw) {
    if (!session) {
      res.cookies.delete('session');
    } else {
      const expiresAt = new Date(session.expires).getTime();
      const remaining = expiresAt - Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      if (remaining < TWELVE_HOURS) {
        const newExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const newSession: SessionData = {
          user: session.user,
          expires: newExp.toISOString(),
          stripeRole: session.stripeRole,
        };
        const newToken = await signToken(newSession);
        res.cookies.set('session', newToken, {
          expires: newExp,
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        });
      }
    }
  }

  return res;
}

// 使用正则排除静态与内置路径（保持轻量、安全）
// 不设置 runtime，默认 Edge（Cloudflare Pages 友好）
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|static|images|assets|.*\\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|txt|map)).*)',
  ],
};
