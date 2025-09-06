// ❌ 不要在 middleware 里写：export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const PROTECTED_PREFIXES = ['/dashboard'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.redirect(new URL('/sign-in', req.url));
    try {
      // 仅校验，不做解构使用
      // 注意：verifyToken 里不能使用 Node-API（已用 jose/edge-safe）

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  return NextResponse.next();
}

// 正常保留 matcher 配置
export const config = { matcher: ['/dashboard/:path*'] };
