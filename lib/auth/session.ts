// lib/auth/session.ts
export {
    getSession,
    setSession,
    clearSession,
    hashPassword,
    verifyPassword as comparePasswords, // 兼容旧命名
  } from './session.server';
  
  export type { SessionPayload } from './jwt';
  