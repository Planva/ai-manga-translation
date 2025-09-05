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

/**
 * 创建会话：写入 JWT cookie，负载为 { user: { id, email, name, role } }
 */
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
    role: user.role ?? null,
  };
  const token = await signToken({ user: claims });

  const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const store = await cookies(); // ✅ Next 15 需要 await 才能拿到可变 cookie store
  store.set(SESSION_COOKIE, token, {
    expires: exp,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies(); // ✅ 这里同样需要 await
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies(); // ✅ 这里同样需要 await
  store.delete(SESSION_COOKIE);
}

/** 小工具：大多数路由只需用户 id */
export async function getUserId(): Promise<number | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const n = Number(session.user.id);
  return Number.isFinite(n) ? n : null;
}
