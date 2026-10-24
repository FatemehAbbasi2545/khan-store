import Link from 'next/link';
export default function PageLinks({ base, page, hasNext, query = {} }: {
  base: string; page: number; hasNext: boolean; query?: Record<string, string | undefined>;
}) {
  function href(value: number) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value !== undefined) params.set(key, value); });
    params.set('page', String(value));
    return `${base}?${params}`;
  }
  return <nav aria-label="صفحه‌بندی" className="mt-8 flex items-center justify-center gap-6 text-sm text-ruby">
    {page > 1 && <Link href={href(page - 1)} className="underline">صفحه قبل</Link>}
    <span>صفحه {page.toLocaleString('fa-IR')}</span>
    {hasNext && <Link href={href(page + 1)} className="underline">صفحه بعد</Link>}
  </nav>;
}
