import 'server-only';
import { cookies } from 'next/headers';
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { verifyToken, signToken, type SessionPayload, type UserClaims } from './jwt';

const SESSION_COOKIE = 'session';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// 供 actions/seed 使用
export async function hashPassword(plain: string) {
  return bcryptHash(plain, 10);
}
export async function verifyPassword(plain: string, hashed: string) {
  return bcryptCompare(plain, hashed);
}

// 统一把 token 解析成 { user: {...} } 的形状返回
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();              // ✅ Next 15 要求 await
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { claims } = await verifyToken(token);
    if (claims && typeof claims === 'object' && 'user' in (claims as any)) {
      return claims as SessionPayload;
    }
    return { user: claims as UserClaims };
  } catch {
    return null;
  }
}

// 允许直接传 DB 用户行或 SessionPayload
type DbUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

export async function setSession(
  payload: SessionPayload | DbUserRow,
  opts?: { expires?: Date },
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

  const expires = opts?.expires ?? new Date(Date.now() + ONE_DAY_MS);
  const token = await signToken(normalized);        // 兼容签名函数的参数形状

  const cookieStore = await cookies();              // ✅ await
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();              // ✅ await
  cookieStore.delete(SESSION_COOKIE);
}
