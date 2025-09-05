// lib/db/schema_free_quota.ts
import { pgTable, text, integer, primaryKey } from 'drizzle-orm/pg-core';

export const freeQuota = pgTable('free_quota', {
  date: text('date').notNull(),
  keyType: text('key_type').notNull(),   // 'user' | 'ip' | 'device'
  key: text('key').notNull(),
  uses: integer('uses').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.date, t.keyType, t.key] }),
}));
