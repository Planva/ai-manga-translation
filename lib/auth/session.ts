// lib/auth/session.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { signToken, verifyToken, type SessionPayload, type UserClaims } from './jwt';

const SESSION_COOKIE = 'session';
const ONE_DAY = 24 * 60 * 60 * 1000;

/** 密码哈希（服务端/Edge 可用） */
export async function hashPassword(plain: string) {
  // saltRounds 10~12 皆可；12 更安全但更慢
  return bcryptHash(plain, 10);
}

/** 密码校验 */
export async function verifyPassword(plain: string, hashed: string) {
  return bcryptCompare(plain, hashed);
}

/** 读取并校验会话（失败返回 null） */
export async function getSession(): Promise<UserClaims | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { claims } = await verifyToken(token);
    return claims;
  } catch {
    return null;
  }
}

/** 设置会话 Cookie（默认 1 天） */
export async function setSession(payload: SessionPayload, opts?: { expires?: Date }) {
  const exp = opts?.expires ?? new Date(Date.now() + ONE_DAY);
  const token = await signToken(payload, exp);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: exp,
  });
}

/** 清理会话 */
export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
