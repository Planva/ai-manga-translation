// lib/db/index.ts
import 'server-only';
import 'dotenv/config';

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// 给外部使用的类型（可选）
export type DB = ReturnType<typeof drizzle>;

let _db: DB | null = null;

/** 单例：在 Cloudflare/Workers 环境用 HTTP 驱动（无 TCP） */
export function requireDb(): DB {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing');

  // `url` 可用普通 postgres 连接串（推荐带 sslmode=require）
  // 例如：postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
  const sql = neon(url);
  _db = drizzle(sql);
  return _db;
}

// 兼容旧代码：同时导出常量 db
export const db = requireDb();
