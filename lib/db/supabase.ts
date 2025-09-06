// lib/db/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

function resolveEnv() {
  // 允许两种命名，任选其一；缺失时在“调用时”抛错（不是导入时）
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return { url, key };
}

/** 仅服务端/Edge 调用：懒创建，避免构建期读取 env */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must be called on the server only');
  }
  const { url, key } = resolveEnv();
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input as any, init as any) },
  });
  return _admin;
}
