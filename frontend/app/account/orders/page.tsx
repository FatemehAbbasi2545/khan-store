'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerApi, CustomerAuthError } from '@/lib/customerApi';
import { getCustomerToken, getCustomerName, clearCustomerSession } from '@/lib/customer-token';
import { useCart } from '@/lib/CartContext';
import ReviewForm from '@/components/ReviewForm';
import type { Order } from '@/lib/types';
import RetryPaymentButton from '@/components/RetryPaymentButton';

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PROCESSING: 'در حال آماده‌سازی',
  OUT_FOR_DELIVERY: 'تحویل به پیک',
  DELIVERED: 'تحویل شده',
  CANCELED: 'لغو شده',
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const { resetCart } = useCart();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reviewedKeys, setReviewedKeys] = useState<string[]>([]);
  const [openReviewKey, setOpenReviewKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const name = getCustomerName();

  function load() {
    customerApi
      .getOrders()
      .then(setOrders)
      .catch((err) => {
        if (err instanceof CustomerAuthError) {
          clearCustomerSession();
          router.replace('/account/login');
        } else {
          setError(err.message);
        }
      });
    customerApi.getReviewedItems().then(setReviewedKeys).catch(() => {});
  }

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace('/account/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function logout() {
    clearCustomerSession();
    resetCart();
    router.push('/');
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-bronze text-xs tracking-[2.5px]">حساب کاربری</div>
          <h2 className="font-display text-2xl text-ruby mt-1">
            {name ? `سفارش‌های ${name}` : 'سفارش‌های من'}
          </h2>
        </div>
        <button onClick={logout} className="text-sm text-navy hover:underline">
          خروج
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!orders && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {orders && orders.length === 0 && (
        <p className="text-ink-soft text-sm text-center py-12">هنوز سفارشی ثبت نکرده‌اید.</p>
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border border-bronze/30 rounded-md p-5 bg-white">
              {o.status === 'PENDING_PAYMENT' && <RetryPaymentButton orderNumber={o.orderNumber} />}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs text-ink-soft font-mono">{o.orderNumber}</div>
                  {o.createdAt && (
                    <div className="text-xs text-ink-soft mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  )}
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-ivory-deep text-ruby">
                  {statusLabel[o.status]}
                </span>
              </div>

              <div className="text-xs text-ink-soft mb-3">
                زمان تحویل: {o.deliveryDate} · {o.deliverySlot}
              </div>

              <div className="space-y-2 mb-3">
                {o.items?.map((i) => {
                  const key = `${o.id}:${i.productId}`;
                  const reviewed = reviewedKeys.includes(key);
                  return (
                    <div key={i.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {i.nameSnapshot} × {i.quantity.toLocaleString('fa-IR')}
                        </span>
                        {o.status === 'DELIVERED' && !reviewed && (
                          <button
                            onClick={() => setOpenReviewKey(openReviewKey === key ? null : key)}
                            className="text-xs text-navy hover:underline"
                          >
                            ثبت نظر
                          </button>
                        )}
                        {reviewed && <span className="text-xs text-ruby">نظر شما ثبت شد ✓</span>}
                      </div>
                      {openReviewKey === key && (
                        <ReviewForm
                          orderId={o.id}
                          productId={i.productId}
                          onDone={() => {
                            setOpenReviewKey(null);
                            load();
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="font-bold text-ruby text-sm">{o.totalToman.toLocaleString('fa-IR')} تومان</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
