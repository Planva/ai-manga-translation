// lib/auth/session.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { signToken, verifyToken, type SessionPayload, type UserClaims } from './jwt';

const SESSION_COOKIE = 'session';
const ONE_DAY = 24 * 60 * 60 * 1000;

export async function hashPassword(plain: string) {
  return bcryptHash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcryptCompare(plain, hashed);
}

export async function getSession(): Promise<UserClaims | null> {
  const cookieStore = await cookies(); // ✅ Next 15 要求 await
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { claims } = await verifyToken(token);
    return claims;
  } catch {
    return null;
  }
}

// 允许直接传 DB 用户行，自动归一化为 SessionPayload
type DbUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

export async function setSession(
  payload: SessionPayload | DbUserRow,
  opts?: { expires?: Date }
) {
  const normalized: SessionPayload =
    'user' in payload
      ? payload
      : {
          user: {
            id: payload.id,
            email: payload.email,
            name: payload.name ?? undefined,
            role: payload.role,
          },
        };

  const exp = opts?.expires ?? new Date(Date.now() + ONE_DAY);
  const token = await signToken(normalized, exp);

  const cookieStore = await cookies(); // ✅ await
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: exp,
  });
}

export async function clearSession() {
  const cookieStore = await cookies(); // ✅ await
  cookieStore.delete(SESSION_COOKIE);
}
