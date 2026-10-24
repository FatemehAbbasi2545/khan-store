import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await api.getArticle(slug).catch(() => null);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/magazine/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.coverImage?.startsWith('http') ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await api.getArticle(slug).catch(() => null);
  if (!article) return notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {article.coverImage && (
        <div
          className="h-64 rounded-md bg-cover bg-center mb-8 border border-bronze/30"
          style={{ backgroundImage: `url(${article.coverImage})` }}
        />
      )}
      <div className="text-bronze text-xs tracking-[2.5px] mb-2">مجله گل خان</div>
      <h1 className="font-display text-3xl text-ruby mb-6">{article.title}</h1>
      <div className="text-sm text-ink-soft leading-8 whitespace-pre-line">{article.content}</div>
    </div>
  );
}
