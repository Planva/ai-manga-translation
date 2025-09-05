// app/api/user/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 动态导入，避免构建期触发 env/数据库初始化
    const { getUser } = await import('@/lib/db/queries');

    const user = await getUser();

    return Response.json(user, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[user] error:', e?.stack || e);
    return Response.json(
      { error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
