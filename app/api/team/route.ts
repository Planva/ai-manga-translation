// app/api/team/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 动态导入，避免构建期读取 env / 连接数据库
    const { getTeamForUser } = await import('@/lib/db/queries');

    const team = await getTeamForUser();

    return Response.json(team, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[team] error:', e?.stack || e);
    return Response.json(
      { error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
