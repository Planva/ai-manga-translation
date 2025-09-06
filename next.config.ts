// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    // 很关键：关闭 PPR，避免生成的 client-reference manifest 路径/命名变化
    ppr: false,
  },
  // 可选：如果之前打开了 typedRoutes / etc. 也可以先都关掉，减少变量
  // typedRoutes: false,
};

export default config;
