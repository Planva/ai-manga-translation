// lib/auth/session.ts
import 'server-only';

// 直接复用 server 版本的实现，并做命名兼容
export { hashPassword } from './session.server';
export { verifyPassword as comparePasswords } from './session.server';
export { setSession, getSession, clearSession } from './session.server';

// 类型也一并转出（如有用到）
export type { SessionPayload, UserClaims } from './jwt';
