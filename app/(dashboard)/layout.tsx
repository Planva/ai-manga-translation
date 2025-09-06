import { SWRConfig } from 'swr'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/SiteFooter'

export const runtime = 'edge';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let fallback: Record<string, unknown> = {}

  // 只有在必需的 env 都存在时才去触发服务端取数
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { getUser, getTeamForUser } = await import('@/lib/db/queries')
      const [u, t] = await Promise.allSettled([getUser(), getTeamForUser()])
      fallback['/api/user'] = u.status === 'fulfilled' ? u.value : null
      fallback['/api/team'] = t.status === 'fulfilled' ? t.value : null
    } catch {
      // 忽略，保持空 fallback，前端自己拉
    }
  }

  return (
    <SWRConfig value={{ fallback }}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </SWRConfig>
  )
}
