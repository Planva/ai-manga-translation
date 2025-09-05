import 'server-only';

import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NewUser } from '@/lib/db/schema';

const SESSION_COOKIE = 'session';
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET is missing');
}
const key = new TextEncoder().encode(AUTH_SECRET);
const SALT_ROUNDS = 10;

export type SessionData = {
  user: {
    id: number | string;
    email?: string | null;
    name?: string | null;
  };
  expires: string;
  stripeRole?: 'free' | 'paid';
};

// -------- Password helpers --------
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(plain: string, hashed: string) {
  return compare(plain, hashed);
}

// -------- JWT helpers --------
export async function signToken(payload: SessionData): Promise<string> {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day') // 等价于 24h
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionData> {
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  return payload as unknown as SessionData;
}

// -------- Cookie session helpers --------
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return await verifyToken(raw);
  } catch {
    // token 过期或非法，清理由我们来做，避免反复报错
    await clearSession();
    return null;
  }
}

export async function setSession(
  user: Pick<NewUser, 'id' | 'email' | 'name'> & { id: number | string },
  stripeRole: 'free' | 'paid' = 'free'
): Promise<void> {
  const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session: SessionData = {
    user: {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
    },
    expires: exp.toISOString(),
    stripeRole,
  };

  const token = await signToken(session);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    expires: exp,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
