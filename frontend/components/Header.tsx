'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { getCustomerToken } from '@/lib/customer-token';
import { SHOP_ENABLED } from '@/lib/site';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { cart } = useCart();
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoggedIn(!!getCustomerToken());
  }, [pathname]);

  return (
    <header className="bg-ivory border-b border-bronze/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/khan-logo-horizontal.svg" alt="گل خان" className="h-10 w-auto" />
          <span className="hidden sm:block text-[11px] text-ink-soft leading-tight border-r border-bronze/30 pr-3">
            فروشگاه ممتاز
            <br />
            گل و گیاه
          </span>
        </Link>

        <nav className="hidden md:flex gap-2 text-sm text-ink-soft">
          <Link href="/" className="px-3 py-2 hover:text-ruby">
            خانه
          </Link>
          <Link href="/catalog" className="px-3 py-2 hover:text-ruby">
            کاتالوگ
          </Link>
          {SHOP_ENABLED && (
            <Link href="/occasion" className="px-3 py-2 hover:text-ruby">
              گل مناسبتی
            </Link>
          )}
          <Link href="/magazine" className="px-3 py-2 hover:text-ruby">
            مجله
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href={loggedIn ? '/account/orders' : '/account/login'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bronze/40 bg-ivory text-ruby transition-colors hover:border-bronze hover:bg-ivory-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            title={loggedIn ? 'سفارش‌های من' : 'ورود / ثبت‌نام'}
            aria-label={loggedIn ? 'سفارش‌های من' : 'ورود / ثبت‌نام'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="14" cy="10.5" r="4" />
              <path d="M5.5 26v-2a8.5 8.5 0 0 1 17 0v2" />
              <path
                d="M23 17c-3-4-.5-8 5-9 .5 5-1 9-5 9Zm0 0 3-5"
                className="stroke-bronze"
              />
            </svg>
          </Link>
          {SHOP_ENABLED && (
            <Link
              href="/cart"
              title="سبد خرید"
              aria-label={`سبد خرید، ${itemCount.toLocaleString('fa-IR')} کالا`}
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bronze/40 bg-ivory text-ruby transition-colors hover:border-bronze hover:bg-ivory-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true" focusable="false">
                <path d="M5 12h22l-2.5 14h-17L5 12Z" />
                <path d="m10 12 4-7m8 7-4-7M12 17v4m8-4v4" />
                <path d="M16 17c0-4 3-6 6-5 0 4-2 6-6 5Zm0 0 3-2" className="stroke-bronze" />
              </svg>
              {itemCount > 0 && (
                <span aria-hidden="true" className="absolute -top-1 -left-1 bg-ruby text-ivory border border-ivory text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {itemCount.toLocaleString('fa-IR')}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
