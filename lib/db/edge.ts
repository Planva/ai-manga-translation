// lib/db/edge.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
// 如你有 schema：import * as schema from './schema';

const url = process.env.DATABASE_URL!;
const sql = neon(url);

export const db = drizzle(sql /*, { schema }*/);
