import SiteContentEditor from '@/components/admin/SiteContentEditor';
import { DEFAULT_ABOUT_TEXT } from '@/lib/aboutDefault';

export default function AdminAboutPage() {
  return <SiteContentEditor contentKey="about" title="درباره ما" defaultText={DEFAULT_ABOUT_TEXT} href="/about" />;
}
