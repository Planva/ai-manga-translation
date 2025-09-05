// lib/auth/session.server.ts —— 仅服务器使用（Route Handlers/Server Actions/RSC）
import 'server-only';
import { cookies } from 'next/headers';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcrypt-ts';
import { signToken, verifyToken, type SessionPayload, type UserClaims } from './jwt';

const SESSION_COOKIE = 'session';

export async function hashPassword(plain: string): Promise<string> {
  return bcryptHash(plain, 10);
}
export async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return bcryptCompare(plain, hashed);
}

export async function createSession(user: {
  id: string | number;
  email: string;
  name?: string | null;
  role?: string | null;
}): Promise<void> {
  const claims: UserClaims = {
    id: String(user.id ?? ''),
    email: user.email,
    name: user.name ?? null,
    role: user.role ?? null
  };
  const token = await signToken({ user: claims });

  const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const store = await cookies(); // Next 15: 这里需要 await
  store.set(SESSION_COOKIE, token, {
    expires: exp,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/'
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getUserId(): Promise<number | null> {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}
