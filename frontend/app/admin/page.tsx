'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError, type DashboardStats } from '@/lib/adminApi';

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PROCESSING: 'در حال آماده‌سازی',
  OUT_FOR_DELIVERY: 'تحویل به پیک',
  DELIVERED: 'تحویل شده',
  CANCELED: 'لغو شده',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getDashboard()
      .then(setStats)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }, [router]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-ink-soft">در حال بارگذاری...</p>;

  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">داشبورد</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white border border-bronze/30 rounded-md p-6">
          <div className="text-xs text-ink-soft mb-2">تعداد سفارش‌ها</div>
          <div className="text-3xl font-bold text-ruby">{stats.totalOrders.toLocaleString('fa-IR')}</div>
        </div>
        <div className="bg-white border border-bronze/30 rounded-md p-6">
          <div className="text-xs text-ink-soft mb-2">جمع فروش</div>
          <div className="text-3xl font-bold text-ruby">
            {stats.totalRevenue.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span>
          </div>
        </div>
        <div className="bg-white border border-bronze/30 rounded-md p-6">
          <div className="text-xs text-ink-soft mb-3">وضعیت سفارش‌ها</div>
          <div className="space-y-1 text-sm">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="text-ink-soft">{statusLabel[status] ?? status}</span>
                <span className="font-semibold">{count.toLocaleString('fa-IR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-bronze/30 rounded-md p-6">
        <h4 className="text-sm text-ruby mb-4">پرفروش‌ترین محصولات</h4>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-ink-soft">هنوز سفارشی ثبت نشده.</p>
        ) : (
          <div className="space-y-2">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-bronze/20 pb-2">
                <span>{p.name}</span>
                <span className="text-ink-soft">{p.quantity.toLocaleString('fa-IR')} عدد</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
