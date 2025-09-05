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

// ✅ 仅用于服务端动作的“会话用户”最小安全类型
export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
  stripe_customer_id?: string | null;
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

// ⚠️ 这里把原先的 `User`（DB 完整类型）改为 `SessionUser`
type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: SessionUser
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // 将会话里的用户信息规范化为 SessionUser，避免要求 DB 的完整字段
    const safeUser: SessionUser = {
      id: Number((user as any).id),
      email: String((user as any).email),
      name: (user as any).name ?? null,
      stripe_customer_id: (user as any).stripe_customer_id ?? null,
    };

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, safeUser);
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
