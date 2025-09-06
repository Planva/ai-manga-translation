// lib/auth/session.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { signToken, verifyToken, type SessionPayload } from './jwt';

const SESSION_COOKIE = 'session';

export async function hashPassword(plain: string) {
  return bcryptHash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcryptCompare(plain, hash);
}

export async function setSession(payload: SessionPayload) {
  const token = await signToken(payload);
  const c = await cookies(); // 动态 API：必须 await
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 天
  });
}

export async function clearSession() {
  const c = await cookies(); // 动态 API：必须 await
  c.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies(); // 动态 API：必须 await
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // 兼容两种返回：直接 payload 或 { claims: payload }
  const decoded: any = await verifyToken(token);
  const payload: any =
    decoded && typeof decoded === 'object'
      ? ('user' in decoded
          ? decoded
          : ('claims' in decoded ? decoded.claims : null))
      : null;

  if (payload && payload.user && typeof payload.user.id !== 'undefined') {
    return payload as SessionPayload;
  }
  return null;
}
