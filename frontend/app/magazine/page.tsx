import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import PageLinks from '@/components/PageLinks';

export const metadata: Metadata = {
  title: 'مجله گل و گیاه',
  description: 'مقالات آموزشی نگهداری از گل و گیاه، از فروشگاه گل خان.',
  alternates: { canonical: '/magazine' },
};

export default async function MagazinePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.min(10000, Math.max(1, Math.floor(Number((await searchParams).page) || 1)));
  const articles = await api.getArticles(page).catch(() => []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="text-center mb-12">
        <div className="text-bronze text-xs tracking-[2.5px]">مجله گل خان</div>
        <h1 className="font-display text-3xl text-ruby mt-2">مجله گل و گیاه</h1>
        <p className="text-sm text-ink-soft mt-2">راهنما و نکات نگهداری از گل و گیاه</p>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-ink-soft text-sm py-16">هنوز مقاله‌ای منتشر نشده.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/magazine/${a.slug}`}
              className="border border-bronze/30 rounded-md overflow-hidden bg-white hover:shadow-lg transition"
            >
              {a.coverImage && (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${a.coverImage})` }}
                />
              )}
              <div className="p-4">
                <h3 className="text-base mb-2">{a.title}</h3>
                <p className="text-xs text-ink-soft line-clamp-2">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <PageLinks base="/magazine" page={page} hasNext={articles.length === 12} />
    </div>
  );
}
