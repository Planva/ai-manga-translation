// lib/auth/session.ts —— 垫片层：兼容历史写法
export {
  createSession as setSession,
  createSession,
  getSession,
  clearSession,
  hashPassword,
  comparePasswords,
  getUserId
} from './session.server';

export type { SessionPayload, UserClaims } from './jwt';
