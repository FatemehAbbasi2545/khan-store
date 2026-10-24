import SiteContentEditor from '@/components/admin/SiteContentEditor';
import { brandContent } from '@/lib/brandContent';

export default function Page() {
  return <SiteContentEditor contentKey="values" title={brandContent.values.title} defaultText={brandContent.values.defaultText} href="/values" />;
}
