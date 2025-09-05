// lib/auth/session.ts
import 'server-only';

import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NewUser } from '@/lib/db/schema';

const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-secret'; // 请在生产环境设置 AUTH_SECRET
const key = new TextEncoder().encode(AUTH_SECRET);

const SESSION_COOKIE = 'session';
const SALT_ROUNDS = 10 as const;

export type SessionData = {
  user: { id: number };
  expires: string;                  // ISO string
  stripeRole: 'free' | 'paid';
};

// --- Password helpers -------------------------------------------------------

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// --- JWT helpers ------------------------------------------------------------

export async function signToken(payload: SessionData) {
  // SignJWT 的类型参数仅用于辅助类型检查；运行时仍是普通对象
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day') // 相对时间
    .sign(key);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionData;
}

// --- Session (cookie) helpers ----------------------------------------------

export async function getSession(): Promise<SessionData | null> {
  const store = cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return await verifyToken(raw);
  } catch {
    // token 过期或非法时，返回 null（也可选择在此删除 cookie）
    return null;
  }
}

export async function setSession(
  user: NewUser,
  stripeRole: 'free' | 'paid' = 'free'
) {
  const store = cookies();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session: SessionData = {
    user: { id: Number(user.id) },
    expires: expiresAt.toISOString(),
    stripeRole,
  };

  const jwt = await signToken(session);

  store.set(SESSION_COOKIE, jwt, {
    path: '/',
    expires: expiresAt,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSession() {
  const store = cookies();
  store.delete(SESSION_COOKIE);
}
