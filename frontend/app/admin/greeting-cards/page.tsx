'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError } from '@/lib/adminApi';
import ImageUploadInput from '@/components/admin/ImageUploadInput';
import type { GreetingCard } from '@/lib/types';

export default function AdminGreetingCardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<GreetingCard[] | null>(null);
  const [error, setError] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  function load() {
    adminApi
      .getGreetingCards(page)
      .then(setCards)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }

  useEffect(load, [router, page]);

  async function handleAdd() {
    if (!newImage) return;
    setSaving(true);
    try {
      await adminApi.createGreetingCard(newImage, newLabel || undefined);
      setNewImage('');
      setNewLabel('');
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('این کارت تبریک حذف شود؟')) return;
    await adminApi.deleteGreetingCard(id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">کارت‌های تبریک</h1>

      <div className="bg-white border border-bronze/30 rounded-md p-6 mb-8 max-w-lg">
        <h4 className="text-sm text-ruby mb-4">افزودن کارت جدید</h4>
        <div className="mb-4">
          <ImageUploadInput value={newImage} onChange={setNewImage} label="عکس کارت" />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1 text-ink-soft">عنوان (اختیاری)</label>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="مثلاً: کارت کلاسیک"
            className="w-full border border-bronze/30 rounded-md px-4 py-2.5 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newImage || saving}
          className="bg-ruby text-white px-6 py-2.5 rounded-sm text-sm disabled:opacity-40"
        >
          {saving ? 'در حال افزودن...' : 'افزودن کارت'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!cards && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {cards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="border border-bronze/30 rounded-md overflow-hidden bg-white">
              <div
                className="aspect-[3/4] bg-cover bg-center"
                style={{ backgroundImage: `url(${c.imageData})` }}
              />
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-ink-soft truncate">{c.label || '—'}</span>
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600">
                  حذف
                </button>
              </div>
            </div>
          ))}
          {cards.length === 0 && <p className="text-ink-soft text-sm col-span-full">هنوز کارتی اضافه نشده.</p>}
        </div>
      )}
      <div className="mt-6 flex gap-6 text-sm text-ruby">
        <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>صفحه قبل</button>
        <span>{page.toLocaleString('fa-IR')}</span>
        <button disabled={!cards || cards.length < 12} onClick={() => setPage((value) => value + 1)}>صفحه بعد</button>
      </div>
    </div>
  );
}
