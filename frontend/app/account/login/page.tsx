'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customerApi, type Captcha } from '@/lib/customerApi';
import { setCustomerSession } from '@/lib/customer-token';
import { accountDestination } from '@/lib/auth-return';

export default function LoginPage() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState('/account/orders');
  useEffect(() => {
    setReturnTo(accountDestination(new URLSearchParams(window.location.search).get('next')));
  }, []);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function loadCaptcha() {
    customerApi.getCaptcha().then(setCaptcha).catch(() => {});
  }

  useEffect(loadCaptcha, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captcha) return;
    setLoading(true);
    setError('');
    try {
      const { token, name } = await customerApi.login(
        phone,
        password,
        captcha.token,
        Number(captchaAnswer),
      );
      setCustomerSession(token, name);
      router.replace(returnTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'ورود با خطا مواجه شد');
      setCaptchaAnswer('');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="font-display text-3xl text-ruby">گل خان</div>
        <div className="text-xs text-ink-soft mt-1">ورود به حساب کاربری</div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-bronze/30 rounded-md p-8 space-y-4">
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
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>

        {captcha && (
          <div>
            <label className="block text-sm mb-1 text-ink-soft">
              کد امنیتی: {captcha.question}
            </label>
            <input
              required
              inputMode="numeric"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="پاسخ را وارد کنید"
              className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !captcha}
          className="w-full bg-ruby text-white py-2.5 rounded-sm text-sm disabled:opacity-50"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
        <p className="text-xs text-center text-ink-soft">
          حساب ندارید؟{' '}
          <Link href={`/account/register?next=${encodeURIComponent(returnTo)}`} className="text-ruby underline">
            ثبت‌نام کنید
          </Link>
        </p>
      </form>
    </div>
  );
}
