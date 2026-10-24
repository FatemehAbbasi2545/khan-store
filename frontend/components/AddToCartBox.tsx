'use client';

import { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import type { Product } from '@/lib/types';

export default function AddToCartBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, pending, loading } = useCart();
  const [error, setError] = useState('');
  const outOfStock = product.stockStatus === 'OUT_OF_STOCK';

  async function handleAdd() {
    setError(''); setAdded(false);
    try { await addItem(product.id, qty); setAdded(true); setTimeout(() => setAdded(false), 2000); }
    catch (err) { setError(err instanceof Error ? err.message : 'افزودن کالا ناموفق بود.'); }
  }

  return (
    <div className="my-5"><div className="flex items-center gap-4">
      <div className="flex items-center border border-bronze/30 rounded-md">
        <button className="w-9 h-9" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <span className="w-8 text-center">{qty.toLocaleString('fa-IR')}</span>
        <button className="w-9 h-9" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={outOfStock || pending || loading}
        className="flex-1 bg-ruby text-white py-3 rounded-sm hover:bg-ruby-light transition disabled:opacity-40"
      >
        {outOfStock ? 'ناموجود' : added ? 'به سبد اضافه شد ✓' : 'افزودن به سبد خرید'}
      </button>
    </div>{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}</div>
  );
}
