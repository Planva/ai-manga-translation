// lib/db/drizzle.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 优先使用 Cloudflare Pages 的 Hyperdrive 连接串，其次回退到本地/直连
const DB_URL =
  process.env.HYPERDRIVE_CONNECTION_STRING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!DB_URL) {
  throw new Error(
    'Missing DB connection string. Set HYPERDRIVE_CONNECTION_STRING (preferred) or DATABASE_URL / POSTGRES_URL.'
  );
}

// 是否走 Hyperdrive：有 HYPERDRIVE_CONNECTION_STRING 就认为是
const usingHyperdrive = Boolean(process.env.HYPERDRIVE_CONNECTION_STRING);

/**
 * 非 Hyperdrive 情况下保留你原来的 SSL 逻辑：
 * - 本地（localhost/127.0.0.1）默认不启用 SSL
 * - 非本地：启用 SSL 并跳过证书校验（Supabase 等托管 PG 常见）
 *   如果连接串里已有 ?sslmode=require 也兼容
 */
const needsSsl =
  !usingHyperdrive &&
  !/localhost|127\.0\.0\.1/i.test(DB_URL) &&
  process.env.PG_SSL !== 'disable';

const client = usingHyperdrive
  ? postgres(DB_URL) // Hyperdrive 不需要额外 SSL 选项
  : postgres(DB_URL, needsSsl ? { ssl: { rejectUnauthorized: false } } : {});

// 给 drizzle 用（注意：这个 db 和 lib/db/index.ts 的 pg 版 db 是不同客户端）
export const db = drizzle(client, { schema });

// 可选导出原始 client，给关闭连接或健康检查用
export { client };
