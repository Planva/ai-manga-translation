// app/layout.tsx
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { getUser, getTeamForUser } from '@/lib/db/queries'
import { SWRConfig } from 'swr'
import Image from 'next/image'
export const runtime = 'edge';


export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.',
}

export const viewport: Viewport = { maximumScale: 1 }

const manrope = Manrope({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
      suppressHydrationWarning
    >
      {/* 注意：去掉原来的 body 灰底，换成 relative，给背景让路 */}
      <body className="relative min-h-[100dvh] antialiased overflow-y-scroll">
        {/* 全局背景层（所有页面共用） */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <Image
            src="/branding/hero-bg.png"   // ← 若你是 .png 放这张；若是 .jpg 改扩展名
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,.45),transparent_40%),rgba(2,6,23,.65)]" />
        </div>

        <SWRConfig
          value={{
            fallback: {
              // 不 await；用的人自己 suspend
              '/api/user': getUser(),
              '/api/team': getTeamForUser(),
            },
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  )
}
