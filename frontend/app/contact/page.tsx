'use client';

import { useEffect, useState } from 'react';
import { customerApi } from '@/lib/customerApi';
import { getCustomerToken } from '@/lib/customer-token';

export default function ContactPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCustomerToken()) return;
    setLoggedIn(true);
    customerApi
      .getProfile()
      .then((p) => setProfile({ name: p.name, phone: p.phone }))
      .catch(() => {});
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await customerApi.submitContact(
        profile?.name ?? form.name,
        profile?.phone ?? form.phone,
        form.email,
        form.message,
      );
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'ارسال پیام با خطا مواجه شد');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4 text-ruby">✓</div>
        <h2 className="font-display text-2xl text-ruby mb-2">پیام شما ارسال شد</h2>
        <p className="text-sm text-ink-soft">همکاران ما در اسرع وقت با شما تماس می‌گیرند.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-14">
      <div className="text-center mb-8">
        <div className="text-bronze text-xs tracking-[2.5px]">تماس با ما</div>
        <h2 className="font-display text-3xl text-ruby mt-2">در خدمت شما هستیم</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-bronze/30 rounded-md p-8 space-y-4">
        {loggedIn && profile ? (
          <div className="bg-ivory-deep/60 rounded-md p-4 text-sm text-ink-soft">
            ارسال به نام <span className="font-semibold text-ink">{profile.name}</span> — شماره تماس{' '}
            <span className="font-semibold text-ink">{profile.phone}</span>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm mb-1 text-ink-soft">نام و نام خانوادگی</label>
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-ink-soft">شماره تماس</label>
              <input
                required
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="09xxxxxxxxx"
                className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm mb-1 text-ink-soft">آدرس ایمیل</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-ink-soft">پیام شما</label>
          <textarea
            required
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm min-h-[120px]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ruby text-white py-2.5 rounded-sm text-sm disabled:opacity-50"
        >
          {submitting ? 'در حال ارسال...' : 'ارسال پیام'}
        </button>
      </form>
    </div>
  );
}
