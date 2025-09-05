// lib/auth/jwt.ts  —— Edge-safe: 可被 middleware 引用
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET is missing');
}
const key = new TextEncoder().encode(AUTH_SECRET);

export type SessionPayload = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
};

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day')
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, key);
  return payload as unknown as SessionPayload;
}
