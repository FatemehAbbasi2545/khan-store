'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError } from '@/lib/adminApi';

export default function SiteContentEditor({ contentKey, title, defaultText, href }: {
  contentKey: string;
  title: string;
  defaultText: string;
  href: string;
}) {
  const router = useRouter();
  const [text, setText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getSiteContent(contentKey)
      .then((c) => setText(c.value?.trim() ? c.value : defaultText))
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }, [router, contentKey, defaultText]);

  async function handleSave() {
    if (text === null) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await adminApi.saveSiteContent(contentKey, text);
      setSaved(true);
    } catch (err: any) {
      if (err instanceof AdminAuthError) router.replace('/admin/login');
      else setError(err.message ?? 'ذخیره‌سازی با خطا مواجه شد');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ruby mb-2">متن صفحه‌ی «{title}»</h1>
      <p className="text-xs text-ink-soft mb-6">
        هر پاراگراف را با یک خط خالی از پاراگراف بعدی جدا کنید. بعد از ذخیره، تغییر بلافاصله در صفحه‌ی{' '}
        <a href={href} target="_blank" rel="noopener" className="text-navy underline">
          {title}
        </a>{' '}
        نمایش داده می‌شود.
      </p>

      {text === null && error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {text === null && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {text !== null && (
        <div className="space-y-4">
          <textarea
            value={text}
            aria-label={`متن ${title}`}
            maxLength={20000}
            onChange={(e) => {
              setText(e.target.value);
              setSaved(false);
            }}
            className="w-full border border-bronze/30 rounded-md px-4 py-3 text-sm leading-7 min-h-[360px] bg-white"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-ruby">✓ ذخیره شد</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || text.trim().length < 10}
              className="bg-ruby text-white px-6 py-2.5 rounded-sm text-sm disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('متن پیش‌فرض جایگزین متن فعلی در ادیتور شود؟ (تا ذخیره نکنید تغییری در سایت اعمال نمی‌شود)')) {
                  setText(defaultText);
                  setSaved(false);
                }
              }}
              className="border border-bronze/30 px-6 py-2.5 rounded-sm text-sm"
            >
              بازگرداندن متن پیش‌فرض
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
