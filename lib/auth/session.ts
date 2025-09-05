// lib/auth/session.ts
// 垫片：保持历史用法不改，内部转到 server-only 实现
export {
  // 历史名称兼容
  createSession as setSession,

  // 如果其他地方直接用了这些名字，也一并透出
  createSession,
  getSession,
  clearSession,
  hashPassword,
  comparePasswords,
} from './session.server';
