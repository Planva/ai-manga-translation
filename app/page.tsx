// 不引入任何额外组件，直接复用分组里的首页
export { default } from './(dashboard)/page';

// 注意你在 Cloudflare Pages 上使用的是静态输出目录，
// 为了确保被静态导出到 .vercel/output/static，强制静态即可：
export const dynamic = 'force-static';
