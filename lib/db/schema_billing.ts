// lib/db/schema_billing.ts
import { pgTable, integer, text, timestamp, bigserial, jsonb } from 'drizzle-orm/pg-core';

/**
 * 用户积分钱包（总余额）
 * - userId: 对应 users.id（integer）
 * - balance: 当前可用积分
 */
export const creditWallet = pgTable('credit_wallet', {
  userId: integer('user_id').primaryKey(),
  balance: integer('balance').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 积分流水（增/减明细）
 * - delta: 正数增加，负数扣减
 * - reason/meta/externalId: 用于对账与审计
 */
export const creditLedger = pgTable('credit_ledger', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: integer('user_id').notNull(),
  delta: integer('delta').notNull(),
  reason: text('reason'),
  meta: jsonb('meta'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
