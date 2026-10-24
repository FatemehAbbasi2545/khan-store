import type { Metadata } from 'next';
import BrandContentPage from '@/components/BrandContentPage';
import { brandContent } from '@/lib/brandContent';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: brandContent.story.title,
  description: brandContent.story.description,
  alternates: { canonical: '/story' },
};
export default function Page() {
  return <BrandContentPage contentKey="story" />;
}
