import Link from 'next/link';
import { api } from '@/lib/api';
import { cookies } from 'next/headers';
import RetryPaymentButton from '@/components/RetryPaymentButton';

export const dynamic = 'force-dynamic';

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PROCESSING: 'در حال آماده‌سازی',
  OUT_FOR_DELIVERY: 'تحویل به پیک',
  DELIVERED: 'تحویل شده',
  CANCELED: 'لغو شده',
};

export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[]; result?: string | string[] }>;
}) {
  const query = await searchParams;
  const orderNumber = typeof query.order === 'string'
    && /^KHAN-[A-Z0-9-]{1,64}$/.test(query.order) ? query.order : null;
  const receiptToken = orderNumber ? (await cookies()).get(`khan_receipt_${orderNumber}`)?.value : undefined;
  const order = orderNumber && receiptToken
    ? await api.getOrder(orderNumber, receiptToken).catch(() => null) : null;
  const success = !!order?.paymentRefId
    && ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status);

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <div className={`text-5xl mb-4 ${success ? 'text-ruby' : 'text-navy'}`}>
        {success ? '✓' : '✕'}
      </div>
      <h2 className="font-display text-3xl text-ruby mb-3">
        {order ? (success ? 'پرداخت با موفقیت انجام شد' : 'پرداخت تأیید نشده است') : 'دسترسی به رسید سفارش'}
      </h2>

      {order ? (
        <div className="border border-bronze/30 rounded-md p-6 bg-white text-right mt-6 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-ink-soft">شماره سفارش</span>
            <span className="font-semibold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">وضعیت</span>
            <span className="font-semibold text-ruby">{statusLabel[order.status]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">مبلغ</span>
            <span className="font-semibold">{order.totalToman.toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>
      ) : (
        <p className="text-ink-soft">
          دسترسی این رسید موجود نیست یا منقضی شده است. اگر با حساب کاربری خرید کرده‌اید، از بخش{' '}
          <Link href="/account/orders" className="text-ruby underline">سفارش‌های من</Link>{' '}
          پیگیری کنید؛ برای خرید مهمان با فروشگاه تماس بگیرید. این پیام به معنی شکست پرداخت نیست.
        </p>
      )}

      <Link href="/catalog" className="inline-block mt-8 text-ruby underline">
        بازگشت به کاتالوگ
      </Link>
      {order?.status === 'PENDING_PAYMENT' && <RetryPaymentButton orderNumber={order.orderNumber} />}
    </div>
  );
}
