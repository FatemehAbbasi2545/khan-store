'use client';

import ShopDisabledNotice from '@/components/ShopDisabledNotice';
import { SHOP_ENABLED } from '@/lib/site';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/lib/CartContext';
import { occasionLabels, occasionOrder } from '@/lib/occasions';
import type { Occasion, Product, GreetingCard } from '@/lib/types';

function OccasionPageInner() {
  const router = useRouter();
  const { addItem } = useCart();

  const [occasion, setOccasion] = useState<Occasion>('BIRTHDAY');
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [cards, setCards] = useState<GreetingCard[]>([]);
  const [cardId, setCardId] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productPage, setProductPage] = useState(1);
  const [cardPage, setCardPage] = useState(1);

  useEffect(() => {
    setLoadingProducts(true);
    api
      .getProducts({ category: 'cut-flowers', page: String(productPage) })
      .then(({ products }) => {
        setProducts(products);
        if (products.length > 0) setProductId((prev) => prev || products[0].id);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));

    api.getGreetingCards(cardPage).then((cards) => {
      setCards(cards);
      if (cards.length > 0) setCardId((previous) => previous || cards[0].id);
    }).catch(() => setCards([]));
  }, [productPage, cardPage]);

  async function handleSubmit() {
    if (!productId) return;
    setSubmitting(true);
    try {
      await addItem(productId, 1, {
        occasion,
        greetingCard: cardId,
        message,
        isAnonymous: anonymous,
      });
      router.push('/cart');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="text-bronze text-xs tracking-[2.5px]">گل مناسبتی</div>
        <h2 className="font-display text-3xl text-ruby mt-2">هدیه‌ای درخور مناسبت خود بسازید</h2>
      </div>

      {/* 1. Occasion */}
      <div className="mb-8">
        <h4 className="text-sm text-ruby mb-3">۱. مناسبت را انتخاب کنید</h4>
        <div className="flex flex-wrap gap-3">
          {occasionOrder.map((key) => {
            const o = occasionLabels[key];
            return (
              <button
                key={key}
                onClick={() => setOccasion(key)}
                className={`px-5 py-2 rounded-full text-sm border flex items-center gap-2 ${
                  occasion === key
                    ? 'bg-ruby text-white border-ruby'
                    : 'bg-white text-ink-soft border-bronze/30'
                }`}
              >
                <span>{o.icon}</span> {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Product */}
      <div className="mb-8">
        <h4 className="text-sm text-ruby mb-3">۲. گل مورد نظر را انتخاب کنید</h4>
        {loadingProducts ? (
          <p className="text-sm text-ink-soft">در حال بارگذاری...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setProductId(p.id)}
                className={`border rounded-lg overflow-hidden text-right ${
                  productId === p.id ? 'border-ruby ring-2 ring-ruby/20' : 'border-bronze/30'
                }`}
              >
                <div
                  className="h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.images[0]})` }}
                />
                <div className="p-2">
                  <div className="text-xs">{p.nameFa}</div>
                  <div className="text-xs text-ink-soft">{p.priceToman.toLocaleString('fa-IR')} تومان</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Greeting card */}
      <div className="mb-6 flex gap-6 text-xs text-ruby">
        <button disabled={productPage === 1} onClick={() => setProductPage((value) => value - 1)}>گل‌های قبلی</button>
        <button disabled={products.length < 12} onClick={() => setProductPage((value) => value + 1)}>گل‌های بعدی</button>
      </div>
      <div className="mb-8">
        <h4 className="text-sm text-ruby mb-3">۳. کارت تبریک را انتخاب کنید</h4>
        {cards.length === 0 ? (
          <p className="text-sm text-ink-soft">هنوز کارت تبریکی توسط مدیر فروشگاه اضافه نشده.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setCardId(c.id)}
                className={`aspect-[3/4] rounded-lg bg-cover bg-center border-2 ${
                  cardId === c.id ? 'border-ruby' : 'border-transparent'
                }`}
                style={{ backgroundImage: `url(${c.imageData})` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Message */}
      <div className="mb-8">
        <h4 className="text-sm text-ruby mb-3">۴. متن پیام</h4>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="متن دلخواه خود را برای کارت تبریک بنویسید..."
          className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm min-h-[90px]"
        />
      </div>

      {/* 5. Anonymous */}
      <div className="mb-10 flex items-center justify-between border border-bronze/30 rounded-md px-5 py-4 bg-white">
        <div>
          <div className="text-sm font-semibold">ارسال ناشناس</div>
          <div className="text-xs text-ink-soft">نام فرستنده روی کارت درج نخواهد شد</div>
        </div>
        <button
          onClick={() => setAnonymous((a) => !a)}
          className={`w-11 h-6 rounded-full relative transition ${anonymous ? 'bg-ruby' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
              anonymous ? 'right-0.5' : 'right-5'
            }`}
          />
        </button>
      </div>

      <div className="mb-6 flex gap-6 text-xs text-ruby">
        <button disabled={cardPage === 1} onClick={() => setCardPage((value) => value - 1)}>کارت‌های قبلی</button>
        <button disabled={cards.length < 12} onClick={() => setCardPage((value) => value + 1)}>کارت‌های بعدی</button>
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || !productId}
        className="w-full bg-ruby text-white py-3 rounded-sm font-medium hover:bg-ruby-light transition disabled:opacity-40"
      >
        {submitting ? 'در حال افزودن...' : 'افزودن به سبد و ادامه خرید'}
      </button>
    </div>
  );
}

export default function OccasionPage() {
  if (!SHOP_ENABLED) return <ShopDisabledNotice />;
  return <OccasionPageInner />;
}
