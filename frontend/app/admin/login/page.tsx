'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { setAdminToken } from '@/lib/admin-token';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await adminApi.login(password);
      setAdminToken(token);
      router.replace('/admin');
    } catch {
      setError('رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white border border-bronze/30 rounded-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="font-display text-3xl text-ruby">گل خان</div>
          <div className="text-xs text-ink-soft mt-1">ورود به پنل مدیریت</div>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          autoFocus
          className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm mb-4"
        />
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ruby text-white py-3 rounded-sm font-medium hover:bg-ruby-light disabled:opacity-50"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
