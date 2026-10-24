'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customerApi } from '@/lib/customerApi';
import { setCustomerSession } from '@/lib/customer-token';
import { accountDestination } from '@/lib/auth-return';

export default function RegisterPage() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState('/account/orders');
  useEffect(() => {
    setReturnTo(accountDestination(new URLSearchParams(window.location.search).get('next')));
  }, []);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { token, name: n } = await customerApi.register(name, phone, password, confirmPassword);
      setCustomerSession(token, n);
      router.replace(returnTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'ثبت‌نام با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="font-display text-3xl text-ruby">گل خان</div>
        <div className="text-xs text-ink-soft mt-1">ساخت حساب کاربری</div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-bronze/30 rounded-md p-8 space-y-4">
        <div>
          <label className="block text-sm mb-1 text-ink-soft">نام و نام خانوادگی</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">شماره تماس</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xxxxxxxxx"
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">رمز عبور</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">تکرار رمز عبور</label>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ruby text-white py-2.5 rounded-sm text-sm disabled:opacity-50"
        >
          {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
        </button>
        <p className="text-xs text-center text-ink-soft">
          حساب دارید؟{' '}
          <Link href={`/account/login?next=${encodeURIComponent(returnTo)}`} className="text-ruby underline">
            وارد شوید
          </Link>
        </p>
      </form>
    </div>
  );
}
