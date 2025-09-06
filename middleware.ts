// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.redirect(new URL('/sign-in', req.url));
    // 这里先不做 verify，确认站点稳定后再加动态导入版
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
