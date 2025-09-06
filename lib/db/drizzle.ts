// lib/db/drizzle.ts —— Edge 友好版
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(DATABASE_URL);         // 基于 fetch，无 Node 依赖
export const db = drizzle(sql, { schema });
export type DB = typeof db;
