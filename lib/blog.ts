// lib/blog.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export type PostMeta = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  author?: string;
};

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

async function ensureBlogDir(): Promise<void> {
  // 目录不存在则创建（Windows/Linux 都可）
  await fs.mkdir(BLOG_DIR, { recursive: true });
}

export async function getAllPosts(): Promise<PostMeta[]> {
  await ensureBlogDir();

  // 目录可能为空，返回 []
  const files = await fs.readdir(BLOG_DIR).catch(() => [] as string[]);
  const posts: PostMeta[] = [];

  for (const file of files) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf-8').catch(() => null);
    if (!raw) continue;

    const { data } = matter(raw);
    const slug = file.replace(/\.mdx?$/, '');

    posts.push({
      slug,
      title: data.title ?? slug,
      description: data.description ?? '',
      date: data.date ?? '',
      author: data.author ?? 'Manga Translator',
    });
  }

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return posts;
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; html: string }> {
  await ensureBlogDir();

  // 支持 .md / .mdx
  let fileContent: string | null = null;
  for (const ext of ['.md', '.mdx']) {
    try {
      fileContent = await fs.readFile(path.join(BLOG_DIR, `${slug}${ext}`), 'utf-8');
      break;
    } catch {}
  }
  if (!fileContent) {
    // 这里可以抛 404，让 Next.js 显示 not-found；或者抛普通错误
    throw new Error(`Post not found: ${slug}`);
  }

  const { data, content } = matter(fileContent);
  const html = marked.parse(content);

  const meta: PostMeta = {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: data.date ?? '',
    author: data.author ?? 'Manga Translator',
  };

  return { meta, html: String(html) };
}
