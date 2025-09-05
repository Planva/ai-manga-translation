// lib/auth/middleware.ts
import { z } from 'zod';
import { TeamDataWithMembers } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

// ✅ 会话内传递的最小用户形态（允许带上 passwordHash，但不是强制）
export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
  stripe_customer_id?: string | null;
  passwordHash?: string;        // <── 新增：供需要校验旧密码的 action 使用
  role?: string | null;         // 可选：有些地方可能会读 role
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (_prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }
    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: SessionUser
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (_prevState: ActionState, formData: FormData) => {
    const raw = await getUser();
    if (!raw) {
      throw new Error('User is not authenticated');
    }

    // 仅做“会话 -> 动作”必要字段的归一化；passwordHash 若存在就透传
    const user: SessionUser = {
      id: Number((raw as any).id),
      email: String((raw as any).email),
      name: (raw as any).name ?? null,
      stripe_customer_id: (raw as any).stripe_customer_id ?? null,
      passwordHash: (raw as any).passwordHash ?? undefined,
      role: (raw as any).role ?? null,
    };

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithTeamFunction<T> = (
  formData: FormData,
  team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const team = await getTeamForUser();
    if (!team) {
      throw new Error('Team not found');
    }

    return action(formData, team);
  };
}
