// app/(dashboard)/blog/[slug]/page.tsx
import { getAllPosts, getPost } from '@/lib/blog';
export const runtime = 'edge';
export const dynamic = 'error';
export const dynamicParams = false;
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// 关键：这里把 params 声明为 Promise，并统一 await
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // 如果传进来是普通对象，await 也会直接得到对象

  const { meta, html } = await getPost(slug);

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 pt-12 pb-24 text-white">
      <header className="mb-6">
        <h1
          className="hero-gradient-text text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(240deg, #ffffff 0%, var(--c-text) 40%, #818CF8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          {meta.title}
        </h1>
        <div className="mt-2 text-xs text-white/60 flex gap-3">
          {meta.date && <span>{new Date(meta.date).toLocaleDateString()}</span>}
          {meta.author && <span>{meta.author}</span>}
        </div>
        {meta.description && (
          <p className="mt-3 text-white/80 text-sm">{meta.description}</p>
        )}
      </header>

      {/* 正文卡片 */}
      <article className="prose prose-invert max-w-none rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
