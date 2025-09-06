// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** 需要登录的前缀 */
const PROTECTED_PREFIXES = ['/dashboard'];
/** 登录/注册页前缀（已登录访问时会被带走） */
const AUTH_PREFIXES = ['/sign-in', '/sign-up'];
/** 静态文件：避免被中间件拦截 */
const PUBLIC_FILE = /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|txt|map|woff2?|ttf|otf)$/i;

/** 只做“是否登录”的轻量判断：解析 JWT payload，看是否过期（不做签名校验） */
function parseJwtUnsafe(token?: string): { exp?: number } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
    const json = atob(base64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function isAuthenticated(req: NextRequest): boolean {
  const raw = req.cookies.get('session')?.value; // 如果你的 cookie 不是 session，这里改名
  if (!raw) return false;
  const payload = parseJwtUnsafe(raw);
  if (!payload) return false;
  if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 跳过 API、Next 内置与静态资源
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

  const authed = isAuthenticated(request);
  const wantsProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const onAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // 已登录访问登录/注册 -> 去 dashboard
  if (authed && onAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 未登录访问受保护 -> 去登录并带回跳
  if (!authed && wantsProtected) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|static|images|assets|.*\\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|txt|map|woff2?|ttf|otf)).*)',
  ],
};
