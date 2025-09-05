// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    ppr: false, // Cloudflare Pages 用稳定版 Next 构建：PPR 仅支持 canary
  },
}
export default nextConfig
