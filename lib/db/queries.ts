// lib/db/queries.ts
import { getSession } from '@/lib/auth/session';

/** 工具：在函数内部按需获取 Supabase Admin 客户端（带缓存） */
async function getAdmin() {
  const { getSupabaseAdmin } = await import('@/lib/db/supabase');
  return getSupabaseAdmin();
}

/** 获取当前登录用户 */
export async function getUser() {
  const session = await getSession().catch(() => null);
  if (!session?.user?.id) return null;

  const supabase = await getAdmin();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, stripe_customer_id')
    .eq('id', Number(session.user.id))
    .maybeSingle();

  if (error) {
    // 失败时返回最小信息，避免上层崩溃
    return {
      id: Number(session.user.id),
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    };
  }
  return (
    data ?? {
      id: Number(session.user.id),
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    }
  );
}

/** 通过 Stripe customerId 找团队 */
export async function getTeamByStripeCustomerId(customerId: string) {
  const supabase = await getAdmin();

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** 更新团队订阅信息 */
export async function updateTeamSubscription(
  teamId: number,
  fields: {
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: string | null;
  }
) {
  const supabase = await getAdmin();

  const payload: any = {};
  if ('stripeSubscriptionId' in fields)
    payload.stripe_subscription_id = fields.stripeSubscriptionId ?? null;
  if ('stripeProductId' in fields)
    payload.stripe_product_id = fields.stripeProductId ?? null;
  if ('planName' in fields) payload.plan_name = fields.planName ?? null;
  if ('subscriptionStatus' in fields)
    payload.subscription_status = fields.subscriptionStatus ?? null;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase.from('teams').update(payload).eq('id', teamId);
  if (error) throw error;
}

/** 获取当前用户所在团队（单团队场景） */
export async function getTeamForUser() {
  const user = await getUser();
  if (!user?.id) return null;

  const supabase = await getAdmin();

  const { data: tm } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', Number(user.id))
    .limit(1)
    .maybeSingle();
  if (!tm?.team_id) return null;

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', tm.team_id)
    .maybeSingle();

  return team ?? null;
}

/**
 * ✅ getUserWithTeam
 * 与原项目调用对齐：从 session 获取 user，再查其 team
 * 返回 { user, team }，两者任意一个不存在时为 null
 */
export async function getUserWithTeam(): Promise<{
  user: { id: number; email?: string | null; name?: string | null } | null;
  team: any | null;
}> {
  const user = await getUser();
  if (!user?.id) return { user: null, team: null };

  const supabase = await getAdmin();

  const { data: tm } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', Number(user.id))
    .limit(1)
    .maybeSingle();

  if (!tm?.team_id) return { user, team: null };

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', tm.team_id)
    .maybeSingle();

  return { user, team: team ?? null };
}
