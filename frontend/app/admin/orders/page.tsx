'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError } from '@/lib/adminApi';
import type { Order } from '@/lib/types';

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PROCESSING: 'در حال آماده‌سازی',
  OUT_FOR_DELIVERY: 'تحویل به پیک',
  DELIVERED: 'تحویل شده',
  CANCELED: 'لغو شده',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    adminApi
      .getOrders()
      .then(setOrders)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }

  useEffect(load, [router]);

  async function handleStatusChange(id: string, status: string) {
    await adminApi.updateOrderStatus(id, status);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">سفارش‌ها</h1>

      {error && <p className="text-red-600">{error}</p>}
      {!orders && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {orders && (
        <div className="bg-white border border-bronze/30 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ivory-deep text-ink-soft text-right">
              <tr>
                <th className="p-3">شماره سفارش</th>
                <th className="p-3">مشتری</th>
                <th className="p-3">شهر</th>
                <th className="p-3">زمان تحویل</th>
                <th className="p-3">مبلغ</th>
                <th className="p-3">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-bronze/20">
                  <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                  <td className="p-3">{o.customerName}</td>
                  <td className="p-3 text-ink-soft">{o.city}</td>
                  <td className="p-3 text-ink-soft text-xs">
                    {o.deliveryDate}
                    <br />
                    {o.deliverySlot}
                  </td>
                  <td className="p-3">{o.totalToman.toLocaleString('fa-IR')} تومان</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="border border-bronze/30 rounded px-2 py-1 text-xs bg-white"
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-soft">
                    هنوز سفارشی ثبت نشده.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
