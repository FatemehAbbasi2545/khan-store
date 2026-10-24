'use client';

import ShopDisabledNotice from '@/components/ShopDisabledNotice';
import { SHOP_ENABLED } from '@/lib/site';

import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { occasionLabels } from '@/lib/occasions';

const DELIVERY_FEE = 150000;

function CartPageInner() {
  const { cart, loading, pending, error, refresh, updateItem, removeItem } = useCart();

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-ink-soft">در حال بارگذاری سبد خرید...</div>;
  }

  if (error && !cart) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={() => refresh()} className="text-ruby underline text-sm">
          تلاش دوباره
        </button>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalToman ?? 0;
  const total = items.length > 0 ? subtotal + DELIVERY_FEE : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-8">
      <div>
        <div className="mb-6">
          {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="text-bronze text-xs tracking-[2.5px]">سبد خرید</div>
          <h2 className="font-display text-3xl text-ruby mt-1">سفارش شما</h2>
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 text-ink-soft">
            سبد خرید شما خالی است.
            <div className="mt-4">
              <Link href="/catalog" className="text-ruby underline">
                مشاهده کاتالوگ
              </Link>
            </div>
          </div>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex gap-4 items-center border-b border-bronze/30 py-4">
            <div
              className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${item.product.images[0] || '/images/placeholder.jpg'})` }}
            />
            <div className="flex-1">
              <h4 className="text-sm mb-1">{item.product.nameFa}</h4>
              {item.occasion && (
                <div className="mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] bg-ivory-deep text-ruby px-2 py-0.5 rounded-full">
                    {occasionLabels[item.occasion].icon} هدیه: {occasionLabels[item.occasion].label}
                    {item.isAnonymous && ' · ارسال ناشناس'}
                  </span>
                  {item.message && (
                    <p className="text-[11px] text-ink-soft mt-1 max-w-xs truncate">«{item.message}»</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <div className="flex items-center border border-bronze/30 rounded">
                  <button
                    className="w-7 h-7"
                    disabled={pending}
                    onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1)).catch(() => {})}
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity.toLocaleString('fa-IR')}</span>
                  <button disabled={pending || item.quantity >= 99} className="w-7 h-7" onClick={() => updateItem(item.id, item.quantity + 1).catch(() => {})}>
                    +
                  </button>
                </div>
                <button disabled={pending} onClick={() => removeItem(item.id).catch(() => {})} className="text-navy hover:underline">
                  حذف
                </button>
              </div>
            </div>
            <div className="font-bold text-ruby">
              {(item.product.priceToman * item.quantity).toLocaleString('fa-IR')} تومان
            </div>
          </div>
        ))}
      </div>

      <div className="border border-bronze/30 rounded-md p-6 bg-white h-max">
        <h4 className="text-ruby mb-4">خلاصه سفارش</h4>
        <div className="flex justify-between text-sm text-ink-soft mb-3">
          <span>جمع کالاها</span>
          <span>{subtotal.toLocaleString('fa-IR')} تومان</span>
        </div>
        <div className="flex justify-between text-sm text-ink-soft mb-3">
          <span>هزینه ارسال</span>
          <span>{items.length > 0 ? DELIVERY_FEE.toLocaleString('fa-IR') : '۰'} تومان</span>
        </div>
        <div className="flex justify-between font-bold text-ruby text-lg border-t border-dashed border-bronze/30 pt-3 mt-3">
          <span>مبلغ قابل پرداخت</span>
          <span>{total.toLocaleString('fa-IR')} تومان</span>
        </div>
        <Link
          href="/checkout"
          className={`block text-center mt-5 py-3 rounded-sm font-medium ${
            items.length === 0
              ? 'bg-gray-300 text-gray-500 pointer-events-none'
              : 'bg-bronze text-ruby-deep hover:bg-bronze-light'
          }`}
        >
          نهایی کردن سفارش و پرداخت
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  if (!SHOP_ENABLED) return <ShopDisabledNotice />;
  return <CartPageInner />;
}
