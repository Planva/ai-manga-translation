// lib/auth/session.ts
import 'server-only';

import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NewUser } from '@/lib/db/schema';

const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-secret'; // 生产环境务必设置
const key = new TextEncoder().encode(AUTH_SECRET);

const SESSION_COOKIE = 'session';
const SALT_ROUNDS = 10;

export type SessionData = {
  user: { id: number };
  expires: string;                 // ISO datetime string
  stripeRole: 'free' | 'paid';
};

// ---------- Password helpers ----------
export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(plain: string, hashed: string) {
  return compare(plain, hashed);
}

// ---------- JWT helpers ----------
export async function signToken(payload: SessionData) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // jose 支持相对时间字符串
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionData> {
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  return payload as unknown as SessionData;
}

// ---------- Session (cookie) helpers ----------
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return await verifyToken(raw);
  } catch {
    return null; // 过期/非法时返回 null
  }
}

export async function setSession(
  user: NewUser,
  stripeRole: 'free' | 'paid' = 'free'
): Promise<void> {
  const store = await cookies();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const session: SessionData = {
    user: { id: Number(user.id) },
    expires: expiresAt.toISOString(),
    stripeRole,
  };
  const token = await signToken(session);
  store.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
