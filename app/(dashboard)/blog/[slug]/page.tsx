// app/(dashboard)/blog/[slug]/page.tsx
import { getAllPosts, getPost } from '@/lib/blog';
import { formatDateForUI } from '@/lib/utils/date';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

type Params = { slug: string };
type Props = { params: Promise<Params> };

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const { meta, html } = await getPost(slug);

  const d = formatDateForUI((meta as any)?.date);

  return (
    <main className="relative mx-auto w-full max-w-3xl px-6 pt-12 pb-24 text-white">
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {(meta as any)?.title ?? 'Untitled'}
        </h1>

        <div className="mt-2 text-sm text-white/70 flex gap-3 items-center">
          {d && <time dateTime={d.iso}>{d.display}</time>}
          {(meta as any)?.author && <span>{(meta as any).author}</span>}
        </div>

        {(meta as any)?.description && (
          <p className="mt-3 text-white/80 text-sm">{(meta as any).description}</p>
        )}
      </header>

      <article className="prose prose-invert max-w-none rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
