'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { adminApi, AdminAuthError } from '@/lib/adminApi';
import type { Product } from '@/lib/types';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getProducts()
      .then((all) => {
        const found = all.find((p) => p.id === params.id);
        if (!found) {
          setError('محصول یافت نشد');
        } else {
          setProduct(found);
        }
      })
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }, [params.id, router]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">ویرایش محصول</h1>
      {error && <p className="text-red-600">{error}</p>}
      {!product && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}
      {product && <ProductForm product={product} />}
    </div>
  );
}
