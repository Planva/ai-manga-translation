// app/(dashboard)/blog/page.tsx
import { getAllPosts } from '@/lib/blog';
import Link from 'next/link';

export const dynamic = 'force-static'; // 纯静态构建

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 pt-12 pb-24 text-white">
      <header className="text-center mb-10">
        <h1
          className="hero-gradient-text text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(240deg, #ffffff 0%, var(--c-text) 40%, #818CF8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          AI Comic Translation: A Guide and Selected Tips
        </h1>
        <p className="mt-3 text-white/70 text-sm">
          Latest updates, guides and tips about manga translation.
        </p>
      </header>

      {/* 卡片列表（与站内风格一致） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {posts.map((p) => (
          <article
            key={p.slug}
            className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-7 backdrop-blur hover:bg-white/[0.08] transition flex flex-col"
          >
            <h2 className="text-lg font-semibold leading-snug">
              <Link href={`/blog/${p.slug}`} className="hover:underline">
                {p.title}
              </Link>
            </h2>

            <div className="mt-2 text-xs text-white/60 flex gap-3">
              {p.date && <span>{new Date(p.date).toLocaleDateString()}</span>}
              {p.author && <span>{p.author}</span>}
            </div>

            {p.description && (
              <p className="mt-3 text-sm text-white/80 line-clamp-3">{p.description}</p>
            )}

            <div className="mt-4">
              <Link
                href={`/blog/${p.slug}`}
                className="inline-flex items-center text-[13px] text-pink-300 hover:text-pink-200"
              >
                Read more →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
