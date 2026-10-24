import Link from 'next/link';
import { SITE_PHONE } from '@/lib/site';

export default function ShopDisabledNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="border border-bronze/30 rounded-md bg-ivory-deep/60 p-4 my-5 text-sm text-ink-soft leading-7">
        ثبت سفارش آنلاین فعلاً غیرفعال است. برای سفارش با شماره{' '}
        <span className="font-semibold text-ruby">{SITE_PHONE}</span> تماس بگیرید.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="text-bronze text-xs tracking-[2.5px] mb-2">سفارش آنلاین</div>
      <h2 className="font-display text-2xl text-ruby mb-4">ثبت سفارش آنلاین فعلاً غیرفعال است</h2>
      <p className="text-sm text-ink-soft leading-7 mb-6">
        برای سفارش گل و گیاه با شماره <span className="font-semibold text-ruby">{SITE_PHONE}</span> تماس
        بگیرید یا از صفحه‌ی تماس با ما برایمان پیام بگذارید.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/catalog" className="bg-ruby text-white px-5 py-2.5 rounded-sm text-sm">
          مشاهده کاتالوگ
        </Link>
        <Link href="/contact" className="border border-bronze/40 text-ruby px-5 py-2.5 rounded-sm text-sm">
          تماس با ما
        </Link>
      </div>
    </div>
  );
}
