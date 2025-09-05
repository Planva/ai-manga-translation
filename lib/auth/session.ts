// lib/auth/session.ts
import { cookies } from 'next/headers';
import * as jose from 'jose';

const DEFAULT_COOKIE_NAME = 'auth_token';
const ALT_COOKIE_NAMES = ['session-token'];

function getAuthSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  return typeof s === 'string' && s.trim() ? s : null;
}
function getCookieName(): string {
  const n = process.env.AUTH_COOKIE_NAME;
  return typeof n === 'string' && n.trim() ? n : DEFAULT_COOKIE_NAME;
}

// 读取 Cookie —— 必须 await cookies()
async function readTokenFromCookies(): Promise<string | null> {
  try {
    const c = await cookies();
    const primary = c.get(getCookieName())?.value ?? null;
    if (primary) return primary;
    for (const alt of ALT_COOKIE_NAMES) {
      const v = c.get(alt)?.value ?? null;
      if (v) return v;
    }
    return null;
  } catch {
    return null;
  }
}

// 设置/删除 Cookie —— 同样 await cookies()
async function setTokenCookie(value: string, maxAgeSeconds: number) {
  const name = getCookieName();
  const jar = await cookies();
  jar.set({
    name,
    value,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

async function deleteTokenCookie() {
  const jar = await cookies();
  try { jar.delete(getCookieName()); } catch {}
  for (const alt of ALT_COOKIE_NAMES) {
    try { jar.delete(alt); } catch {}
  }
}

export type UserClaims = {
  id: number;
  email?: string | null;
  name?: string | null;
};
export type SessionPayload = { user: UserClaims };
export type Session = { user: UserClaims } | null;

export async function createSession(
  payload: SessionPayload | UserClaims,
  opts?: { maxAgeSeconds?: number }
): Promise<void> {
  const secret = getAuthSecret();
  if (!secret) return;

  const user: UserClaims =
    'user' in (payload as any) ? (payload as SessionPayload).user : (payload as UserClaims);

  const id = Number(user?.id);
  if (!Number.isFinite(id)) return;

  const maxAge = Math.max(60, opts?.maxAgeSeconds ?? 60 * 60 * 24 * 30);
  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    uid: id,
    email: user.email ?? null,
    name: user.name ?? null,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAge)
    .sign(new TextEncoder().encode(secret));

  await setTokenCookie(token, maxAge);
}

export const setSession = createSession;

export async function clearSession(): Promise<void> {
  await deleteTokenCookie();
}

export async function getSession(): Promise<Session> {
  const token = await readTokenFromCookies();
  if (!token) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    const idRaw = (payload as any).uid ?? (payload as any).id;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return null;

    const user: UserClaims = {
      id,
      email: (payload as any).email ?? null,
      name: (payload as any).name ?? null,
    };
    return { user };
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<number | null> {
  const s = await getSession();
  return s?.user?.id ?? null;
}

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== 'string' || !plain) throw new Error('Invalid password');
  const bcrypt = await import('bcrypt-ts');
  return bcrypt.hash(plain, 12);
}

export async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  if (typeof plain !== 'string' || typeof hashed !== 'string') return false;
  const bcrypt = await import('bcrypt-ts');
  return bcrypt.compare(plain, hashed);
}
