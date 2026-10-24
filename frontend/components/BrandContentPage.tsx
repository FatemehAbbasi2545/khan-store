import { api } from '@/lib/api';
import { brandContent } from '@/lib/brandContent';

export default async function BrandContentPage({ contentKey }: { contentKey: keyof typeof brandContent }) {
  const page = brandContent[contentKey];
  const content = await api.getSiteContent(contentKey).catch(() => ({ value: null }));
  const text = content.value?.trim() ? content.value : page.defaultText;
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="text-bronze text-xs tracking-[2.5px]">درباره گل خان</div>
        <h1 className="font-display text-3xl text-ruby mt-2">{page.title}</h1>
      </div>
      <div className="text-ink-soft leading-8 space-y-5 text-sm">
        {paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
      </div>
    </div>
  );
}
