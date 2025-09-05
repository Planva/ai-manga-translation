// lib/auth/session.ts
import { cookies } from 'next/headers';
import * as jose from 'jose';

/**
 * 统一在函数内读取 AUTH_SECRET，构建期缺失也不会抛错。
 */
function getAuthSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  return (typeof s === 'string' && s.trim()) ? s : null;
}

type SessionUser = { id: number; email?: string | null; name?: string | null };
export type Session = { user: SessionUser } | null;

/**
 * 约定：从 cookie 里取 token（你项目里若是别的名字，改这里就行）
 */
function getAuthTokenFromCookies(): string | null {
  try {
    const c = cookies();
    return (
      c.get('auth_token')?.value ??
      c.get('session-token')?.value ??
      null
    );
  } catch {
    return null;
  }
}

/**
 * 运行时获取会话：
 * - 没有 SECRET：返回 null（不抛错，保证构建顺利）
 * - 没有 token：返回 null
 * - 校验失败：返回 null
 */
export async function getSession(): Promise<Session> {
  const token = getAuthTokenFromCookies();
  if (!token) return null;

  const secret = getAuthSecret();
  if (!secret) {
    // 构建期 / 运行时未配置：不抛错，直接当未登录
    return null;
  }

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    const idRaw = (payload as any).uid ?? (payload as any).id;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return null;

    const user: SessionUser = {
      id,
      email: (payload as any).email ?? null,
      name: (payload as any).name ?? null,
    };
    return { user };
  } catch {
    return null;
  }
}
