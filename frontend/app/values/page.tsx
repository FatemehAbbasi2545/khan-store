import type { Metadata } from 'next';
import BrandContentPage from '@/components/BrandContentPage';
import { brandContent } from '@/lib/brandContent';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: brandContent.values.title,
  description: brandContent.values.description,
  alternates: { canonical: '/values' },
};
export default function Page() {
  return <BrandContentPage contentKey="values" />;
}
