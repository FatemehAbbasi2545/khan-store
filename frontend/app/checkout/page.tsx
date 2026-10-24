'use client';

import ShopDisabledNotice from '@/components/ShopDisabledNotice';
import { SHOP_ENABLED } from '@/lib/site';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getCartToken } from '@/lib/cart-token';
import { useCart } from '@/lib/CartContext';
import { customerApi, CustomerAuthError } from '@/lib/customerApi';
import { getCustomerToken, clearCustomerSession } from '@/lib/customer-token';
import { CHECKOUT_LOGIN_URL } from '@/lib/auth-return';

const DELIVERY_FEE = 150000;

const TIME_SLOTS = ['۹ تا ۱۲', '۱۲ تا ۱۵', '۱۵ تا ۱۸', '۱۸ تا ۲۱'];

function todayIsoMin() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function CheckoutPageInner() {
  const { cart } = useCart();
  const router = useRouter();
  const [access, setAccess] = useState<'checking' | 'ready' | 'error'>('checking');
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: 'تهران',
  });
  const [deliveryOption, setDeliveryOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState(TIME_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAccess('checking');
    if (!getCustomerToken()) {
      router.replace(CHECKOUT_LOGIN_URL);
      return;
    }
    customerApi
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setForm((f) => ({ ...f, customerName: profile.name, phone: profile.phone }));
        setAccess('ready');
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof CustomerAuthError) {
          clearCustomerSession();
          router.replace(CHECKOUT_LOGIN_URL);
        } else {
          setAccess('error');
        }
      });
    return () => { active = false; };
  }, [router, retry]);

  const total = (cart?.subtotalToman ?? 0) + DELIVERY_FEE;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resolveDeliveryDate(): string | null {
    if (deliveryOption === 'today') return todayIsoMin();
    if (deliveryOption === 'tomorrow') {
      const d = new Date(`${todayIsoMin()}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().slice(0, 10);
    }
    if (!customDate) return null;
    return customDate;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!getCustomerToken()) {
      router.replace(CHECKOUT_LOGIN_URL);
      return;
    }
    const cartToken = getCartToken();
    if (!cartToken) return;

    const resolvedDate = resolveDeliveryDate();
    if (!resolvedDate) {
      setError('لطفاً تاریخ تحویل دلخواه را انتخاب کنید');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { paymentUrl } = await api.createOrder({
        cartToken,
        ...form,
        deliveryDate: resolvedDate,
        deliverySlot,
      });
      window.location.href = paymentUrl;
    } catch (err: any) {
      if (err instanceof CustomerAuthError) {
        clearCustomerSession();
        router.replace(CHECKOUT_LOGIN_URL);
        return;
      }
      setError(err.message ?? 'ثبت سفارش با خطا مواجه شد');
      setSubmitting(false);
    }
  }

  if (access === 'checking') {
    return <p className="px-6 py-16 text-center text-ink-soft" role="status">در حال بررسی ورود...</p>;
  }
  if (access === 'error') {
    return <div className="px-6 py-16 text-center text-ink-soft">
      <p role="alert">بررسی حساب کاربری ممکن نشد. لطفاً دوباره تلاش کنید.</p>
      <button onClick={() => setRetry((value) => value + 1)} className="mt-4 text-ruby underline">تلاش دوباره</button>
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8 text-center">
        <div className="text-bronze text-xs tracking-[2.5px]">تکمیل خرید</div>
        <h2 className="font-display text-3xl text-ruby mt-1">اطلاعات تحویل</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1 text-ink-soft">نام و نام خانوادگی</label>
          <input
            required
            value={form.customerName}
            onChange={(e) => update('customerName', e.target.value)}
            className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">شماره تماس</label>
          <input
            required
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="09xxxxxxxxx"
            className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">شهر</label>
          <input
            required
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">آدرس دقیق</label>
          <textarea
            required
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm min-h-[90px]"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-ink-soft">تاریخ تحویل</label>
          <div className="flex gap-3 flex-wrap mb-3">
            {[
              ['today', 'امروز'],
              ['tomorrow', 'فردا'],
              ['custom', 'زمان‌بندی دلخواه'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setDeliveryOption(value as typeof deliveryOption)}
                className={`px-5 py-2 rounded-full text-sm border ${
                  deliveryOption === value
                    ? 'bg-ruby text-white border-ruby'
                    : 'bg-white text-ink-soft border-bronze/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {deliveryOption === 'custom' && (
            <input
              required
              type="date"
              min={todayIsoMin()}
              max={new Date(new Date(`${todayIsoMin()}T12:00:00Z`).getTime() + 30 * 86400000).toISOString().slice(0, 10)}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-sm mb-2 text-ink-soft">بازه‌ی ساعت تحویل</label>
          <div className="flex gap-3 flex-wrap">
            {TIME_SLOTS.map((slot) => (
              <button
                type="button"
                key={slot}
                onClick={() => setDeliverySlot(slot)}
                className={`px-5 py-2 rounded-full text-sm border ${
                  deliverySlot === slot
                    ? 'bg-ruby text-white border-ruby'
                    : 'bg-white text-ink-soft border-bronze/30'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="border-t border-dashed border-bronze/30 pt-5 flex items-center justify-between">
          <span className="text-ink-soft text-sm">مبلغ قابل پرداخت</span>
          <span className="font-bold text-ruby text-lg">{total.toLocaleString('fa-IR')} تومان</span>
        </div>

        <button
          type="submit"
          disabled={submitting || !cart || cart.items.length === 0}
          className="w-full bg-bronze text-ruby-deep py-3 rounded-sm font-medium hover:bg-bronze-light disabled:opacity-40"
        >
          {submitting ? 'در حال انتقال به درگاه پرداخت...' : 'پرداخت و ثبت نهایی سفارش'}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  if (!SHOP_ENABLED) return <ShopDisabledNotice />;
  return <CheckoutPageInner />;
}
