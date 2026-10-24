'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError, type ContactMessage } from '@/lib/adminApi';

const statusLabel: Record<string, string> = {
  NEW: 'جدید',
  READ: 'خوانده‌شده',
  RESOLVED: 'رسیدگی‌شده',
};

export default function AdminContactMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    adminApi
      .getContactMessages()
      .then(setMessages)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }

  useEffect(load, [router]);

  async function handleStatusChange(id: string, status: string) {
    await adminApi.updateContactMessageStatus(id, status);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">پیام‌های تماس با ما</h1>

      {error && <p className="text-red-600">{error}</p>}
      {!messages && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {messages && messages.length === 0 && (
        <p className="text-ink-soft text-sm">هنوز پیامی دریافت نشده.</p>
      )}

      {messages && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="border border-bronze/30 rounded-md p-5 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-ink-soft">
                    {m.phone} · {m.email}
                  </div>
                </div>
                <select
                  value={m.status}
                  onChange={(e) => handleStatusChange(m.id, e.target.value)}
                  className="border border-bronze/30 rounded px-2 py-1 text-xs bg-white"
                >
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-ink-soft leading-6">{m.message}</p>
              <div className="text-xs text-ink-soft mt-2">
                {new Date(m.createdAt).toLocaleString('fa-IR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
