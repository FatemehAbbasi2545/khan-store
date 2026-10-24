'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CustomerAuthError } from '@/lib/customerApi';
import { CHECKOUT_LOGIN_URL } from '@/lib/auth-return';
export default function RetryPaymentButton({ orderNumber }: { orderNumber: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  return <div className="mt-4">
    <button disabled={busy} className="rounded-sm bg-ruby px-5 py-2 text-sm text-white disabled:opacity-50" onClick={async () => {
      setBusy(true); setError('');
      try { window.location.href = (await api.retryPayment(orderNumber)).paymentUrl; }
      catch (err) {
        if (err instanceof CustomerAuthError) router.push(CHECKOUT_LOGIN_URL);
        else setError(err instanceof Error ? err.message : 'ادامه پرداخت ممکن نشد.');
        setBusy(false);
      }
    }}>{busy ? 'در حال آماده‌سازی...' : 'ادامه پرداخت سفارش'}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
