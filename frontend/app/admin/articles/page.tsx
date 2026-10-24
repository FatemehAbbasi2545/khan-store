'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi, AdminAuthError } from '@/lib/adminApi';
import type { Article } from '@/lib/types';

const statusLabel: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  PUBLISHED: 'منتشرشده',
};

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    adminApi
      .getArticles()
      .then(setArticles)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }

  useEffect(load, [router]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`مقاله‌ی «${title}» حذف شود؟`)) return;
    await adminApi.deleteArticle(id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-ruby">مجله گل و گیاه</h1>
        <Link href="/admin/articles/new" className="bg-ruby text-white px-5 py-2 rounded-sm text-sm">
          + مقاله جدید
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!articles && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}

      {articles && (
        <div className="bg-white border border-bronze/30 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ivory-deep text-ink-soft text-right">
              <tr>
                <th className="p-3">عنوان</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t border-bronze/20">
                  <td className="p-3">{a.title}</td>
                  <td className="p-3 text-ink-soft">{statusLabel[a.status]}</td>
                  <td className="p-3 flex gap-3">
                    <Link href={`/admin/articles/${a.id}`} className="text-navy hover:underline">
                      ویرایش
                    </Link>
                    <button onClick={() => handleDelete(a.id, a.title)} className="text-red-600 hover:underline">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-ink-soft">
                    هنوز مقاله‌ای ثبت نشده.
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
