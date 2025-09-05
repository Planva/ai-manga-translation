// lib/db/schema/index.ts
export * from '@/lib/db/schema_free_quota';  // 你已有的 free_quota 表（上一阶段做好的）
export * from '@/lib/db/schema_billing';     // 新增的钱包与流水
// 如果你原来还有 users/teams 等 schema 文件，也可以在这里统一 export 出来
