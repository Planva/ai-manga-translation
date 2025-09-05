// app/api/team/route.ts
export const runtime = 'edge';

import { getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  const team = await getTeamForUser();
  return Response.json(team);
}
