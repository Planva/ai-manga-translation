// lib/auth/jwt.ts —— Edge-safe，仅做 JWT 编解码
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) throw new Error('AUTH_SECRET is missing');
const key = new TextEncoder().encode(AUTH_SECRET);

export type UserClaims = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
};

export type SessionPayload = { user: UserClaims };

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day')
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, key);
  const p = payload as any;
  if (!p.user && (p.id || p.email)) {
    return {
      user: {
        id: String(p.id ?? ''),
        email: String(p.email ?? ''),
        name: p.name ?? null,
        role: p.role ?? null
      }
    };
  }
  return payload as unknown as SessionPayload;
}
