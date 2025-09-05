// lib/db/index.ts
import 'dotenv/config';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
let _db: NodePgDatabase | null = null;
const sql = neon(process.env.DATABASE_URL!); 
export const db = drizzle(sql);
/** 单例：确保所有服务端代码都走这一份连接 */
export function requireDb(): NodePgDatabase {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing');

  // 1) 如果 URL 自带 sslmode=require，或者设置了 DATABASE_SSL=require，就开 SSL
  const hasRequireInUrl = /\bsslmode=require\b/i.test(url);
  const needSSL =
    hasRequireInUrl ||
    (process.env.DATABASE_SSL || '').toLowerCase() === 'require';

  const pool = new Pool({
    connectionString: url,
    ssl: needSSL ? { rejectUnauthorized: false } : undefined,
  });

  _db = drizzle(pool);
  return _db;
}

/** 兼容旧代码的命名导出 */
export const db = requireDb();
