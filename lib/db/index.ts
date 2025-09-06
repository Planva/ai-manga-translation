// 统一从 drizzle 输出
export { db } from './drizzle';

// 兼容旧调用方
export const getDb = () => db;
export const requireDb = () => db;
