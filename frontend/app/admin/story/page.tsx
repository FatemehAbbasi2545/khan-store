import SiteContentEditor from '@/components/admin/SiteContentEditor';
import { brandContent } from '@/lib/brandContent';

export default function Page() {
  return <SiteContentEditor contentKey="story" title={brandContent.story.title} defaultText={brandContent.story.defaultText} href="/story" />;
}
