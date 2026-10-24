'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArticleForm from '@/components/admin/ArticleForm';
import { adminApi, AdminAuthError } from '@/lib/adminApi';
import type { Article } from '@/lib/types';

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getArticle(params.id)
      .then(setArticle)
      .catch((err) => {
        if (err instanceof AdminAuthError) router.replace('/admin/login');
        else setError(err.message);
      });
  }, [params.id, router]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">ویرایش مقاله</h1>
      {error && <p className="text-red-600">{error}</p>}
      {!article && !error && <p className="text-ink-soft">در حال بارگذاری...</p>}
      {article && <ArticleForm article={article} />}
    </div>
  );
}
