// lib/db/drizzle.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 允许只配一个环境变量：DATABASE_URL；没有就退回 POSTGRES_URL
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DB_URL) {
  throw new Error('DATABASE_URL (or POSTGRES_URL) is not set');
}

/**
 * postgres-js 的 SSL 选项：
 * - 在本地（localhost/127.0.0.1）默认不启用 SSL
 * - 非本地：启用 SSL 并跳过证书校验（Supabase/多数托管 PG 需要）
 *   如果你在连接串里已经加了 ?sslmode=require 也没关系，二者兼容
 */
const needsSsl =
  !/localhost|127\.0\.0\.1/i.test(DB_URL) &&
  process.env.PG_SSL !== 'disable';

const client = postgres(DB_URL, needsSsl ? { ssl: { rejectUnauthorized: false } } : {});

// 给 drizzle 用（注意：这个 db 和你在 lib/db/index.ts 里的 pg 版 db 是两个客户端，指向同一库没问题）
export const db = drizzle(client, { schema });

// 可选导出原始 client，给关连接或健康检查用
export { client };
