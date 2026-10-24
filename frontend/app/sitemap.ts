import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { SHOP_ENABLED } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://golekhan.ir';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/magazine`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/story`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/values`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const routes: MetadataRoute.Sitemap = [...staticRoutes];
  if (SHOP_ENABLED) {
    routes.push({ url: `${siteUrl}/occasion`, changeFrequency: 'weekly', priority: 0.6 });
  }

  try {
    const { products } = await api.getProducts({});
    routes.push(
      ...products.map((p) => ({
        url: `${siteUrl}/product/${p.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    );
  } catch {}

  try {
    const articles = await api.getArticles();
    routes.push(
      ...articles.map((a) => ({
        url: `${siteUrl}/magazine/${a.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
    );
  } catch {}

  return routes;
}
