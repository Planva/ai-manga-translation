// lib/auth/session.ts —— 垫片层：保持历史用法不改
export {
  createSession as setSession, // 兼容旧名
  createSession,
  getSession,
  clearSession,
  hashPassword,
  comparePasswords,
  getUserId,
} from './session.server';

export type { SessionPayload, UserClaims } from './jwt';
