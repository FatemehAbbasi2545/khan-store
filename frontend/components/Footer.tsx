import Link from 'next/link';
import { SHOP_ENABLED, SITE_PHONE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="bg-ruby-deep text-[#CFCABB] mt-16 pt-14 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/khan-logo-horizontal-light.svg" alt="گل خان" className="h-9 w-auto mb-4" />
          <p className="text-sm text-[#9C9784] max-w-xs">
            فروشگاه ممتاز گل و گیاه؛ برای هدیه‌هایی که در خور بهترین لحظات زندگی شما هستند.
          </p>
        </div>
        <div>
          <h5 className="text-bronze-light text-sm mb-4">دسترسی سریع</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/catalog" className="hover:text-bronze-light">
                کاتالوگ محصولات
              </Link>
            </li>
            {SHOP_ENABLED && (
              <li>
                <Link href="/cart" className="hover:text-bronze-light">
                  سبد خرید
                </Link>
              </li>
            )}
            <li>
              <Link href="/account/orders" className="hover:text-bronze-light">
                پیگیری سفارش
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="text-bronze-light text-sm mb-4">خدمات مشتریان</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shipping" className="hover:text-bronze-light">
                شرایط ارسال
              </Link>
            </li>
            <li>
              <Link href="/magazine" className="hover:text-bronze-light">
                مجله گل و گیاه
              </Link>
            </li>
            <li>
              <Link href="/plant-care" className="hover:text-bronze-light">
                راهنمای نگهداری گیاهان
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="text-bronze-light text-sm mb-4">درباره گل خان</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-bronze-light">
                درباره ما
              </Link>
            </li>
            <li><Link href="/story" className="hover:text-bronze-light">داستان شکل‌گیری</Link></li>
            <li><Link href="/values" className="hover:text-bronze-light">ارزش‌ها و نگرش ما</Link></li>
            <li><Link href="/contact" className="hover:text-bronze-light">تماس با ما</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-bronze-light text-sm mb-4">ارتباط با گل خان</h5>
          <ul className="space-y-2 text-sm">
            <li>تماس: {SITE_PHONE}</li>
          </ul>
          <a
            referrerPolicy="origin"
            target="_blank"
            rel="noopener"
            href="https://trustseal.enamad.ir/?id=8281514&Code=NlkA6kwmsx0rxMOQ2Nv7bDhez1gcdYeT"
            aria-label="مشاهده اعتبار نماد اعتماد الکترونیکی گل خان"
            className="inline-block mt-5 rounded-md bg-white p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              referrerPolicy="origin"
              src="https://trustseal.enamad.ir/logo.aspx?id=8281514&Code=NlkA6kwmsx0rxMOQ2Nv7bDhez1gcdYeT"
              alt="نماد اعتماد الکترونیکی گل خان"
              style={{ cursor: 'pointer' }}
              {...{ code: 'NlkA6kwmsx0rxMOQ2Nv7bDhez1gcdYeT' }}
            />
          </a>
        </div>
      </div>
      <div className="border-t border-bronze/25 text-center text-xs py-5 text-[#8B8676]">
        © ۱۴۰۴ فروشگاه گل خان — تمامی حقوق محفوظ است
      </div>
    </footer>
  );
}
