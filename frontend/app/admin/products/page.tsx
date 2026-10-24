'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError } from '@/lib/adminApi';
import type { Product } from '@/lib/types';

const stockLabel: Record<string, string> = {
  IN_STOCK: 'موجود',
  OUT_OF_STOCK: 'ناموجود',
  PREORDER: 'پیش‌سفارش',
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    adminApi
      .getProducts()
      .then(setProducts)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }

  useEffect(load, [router]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`محصول «${name}» حذف شود؟`)) return;
    await adminApi.deleteProduct(id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ruby">محصولات</h1>
        <Link href="/admin/products/new" className="bg-ruby text-white px-5 py-2 rounded-sm text-sm">
          + محصول جدید
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!products && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {products && (
        <div className="bg-white border border-bronze/30 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ivory-deep text-ink-soft text-right">
              <tr>
                <th className="p-3">نام</th>
                <th className="p-3">دسته‌بندی</th>
                <th className="p-3">قیمت</th>
                <th className="p-3">موجودی</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-bronze/20">
                  <td className="p-3">{p.nameFa}</td>
                  <td className="p-3 text-ink-soft">{p.category.nameFa}</td>
                  <td className="p-3">{p.priceToman.toLocaleString('fa-IR')} تومان</td>
                  <td className="p-3 text-ink-soft">{stockLabel[p.stockStatus]}</td>
                  <td className="p-3 flex gap-3">
                    <Link href={`/admin/products/${p.id}`} className="text-navy hover:underline">
                      ویرایش
                    </Link>
                    <button onClick={() => handleDelete(p.id, p.nameFa)} className="text-red-600 hover:underline">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-soft">
                    هنوز محصولی ثبت نشده.
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
