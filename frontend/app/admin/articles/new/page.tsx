'use client';

import ArticleForm from '@/components/admin/ArticleForm';

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ruby mb-8">مقاله جدید</h1>
      <ArticleForm />
    </div>
  );
}
