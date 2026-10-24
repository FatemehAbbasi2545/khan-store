'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminToken, clearAdminToken } from '@/lib/admin-token';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isLoginPage = pathname === '/admin/login';
    const token = getAdminToken();
    if (!token && !isLoginPage) {
      router.replace('/admin/login');
      return;
    }
    setChecked(true);
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <div className="fixed inset-0 z-[100] overflow-auto bg-ivory-deep">{children}</div>;
  }

  if (!checked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ivory-deep text-ink-soft">
        در حال بررسی ورود...
      </div>
    );
  }

  function logout() {
    clearAdminToken();
    router.replace('/admin/login');
  }

  const navItems = [
    { href: '/admin', label: 'داشبورد' },
    { href: '/admin/products', label: 'محصولات' },
    { href: '/admin/orders', label: 'سفارش‌ها' },
    { href: '/admin/greeting-cards', label: 'کارت‌های تبریک' },
    { href: '/admin/articles', label: 'مجله گل و گیاه' },
    { href: '/admin/about', label: 'درباره ما' },
    { href: '/admin/story', label: 'داستان شکل‌گیری' },
    { href: '/admin/values', label: 'ارزش‌ها و نگرش ما' },
    { href: '/admin/contact-messages', label: 'پیام‌های تماس با ما' },
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-ivory-deep flex" dir="rtl">
      <aside className="w-56 bg-ruby-deep text-ivory flex-shrink-0 p-5 flex flex-col">
        <div className="font-display text-xl text-bronze-light mb-8">گل خان · مدیریت</div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded text-sm ${
                pathname === item.href ? 'bg-ruby text-white' : 'text-ivory/80 hover:bg-ruby/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="text-sm text-ivory/70 hover:text-white text-right mt-6">
          خروج
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
