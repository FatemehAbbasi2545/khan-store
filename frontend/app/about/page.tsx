import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { DEFAULT_ABOUT_TEXT } from '@/lib/aboutDefault';

export const metadata: Metadata = {
  title: 'درباره ما',
  description: 'داستان گل خان، فروشگاه ممتاز گل و گیاه.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  // The text is edited from the admin panel; fall back to the default if nothing is saved
  // yet (or the API is unreachable).
  const content = await api.getSiteContent('about').catch(() => ({ key: 'about', value: null }));
  const text = content.value?.trim() ? content.value : DEFAULT_ABOUT_TEXT;
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="text-bronze text-xs tracking-[2.5px]">درباره ما</div>
        <h1 className="font-display text-3xl text-ruby mt-2">گل خان</h1>
      </div>

      <div className="text-ink-soft leading-8 space-y-5 text-sm">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
