// lib/auth/session.ts
import 'server-only';

// 统一从 server 版本导出，并做命名兼容
export { hashPassword } from './session.server';
export { verifyPassword as comparePasswords } from './session.server';
export { setSession, getSession, clearSession } from './session.server';

export type { SessionPayload, UserClaims } from './jwt';
