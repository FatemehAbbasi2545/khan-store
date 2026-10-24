'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import { customerApi } from '@/lib/customerApi';

export default function ReviewForm({
  orderId,
  productId,
  onDone,
}: {
  orderId: string;
  productId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await customerApi.submitReview(orderId, productId, rating, comment || undefined);
      onDone();
    } catch (err: any) {
      setError(err.message ?? 'ثبت نظر با خطا مواجه شد');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-bronze/30 rounded-md p-4 bg-ivory-deep/50 mt-2 space-y-3">
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="نظر شما (اختیاری)"
        className="w-full border border-bronze/30 rounded-md px-3 py-2 text-sm min-h-[60px] bg-white"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-ruby text-white px-5 py-2 rounded-sm text-xs disabled:opacity-50"
      >
        {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
      </button>
    </div>
  );
}
