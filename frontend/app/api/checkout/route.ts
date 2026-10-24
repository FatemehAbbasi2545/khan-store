import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
    return NextResponse.json({ message: 'برای نهایی کردن سفارش باید وارد حساب کاربری شوید.' }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'اطلاعات سفارش معتبر نیست.' }, { status: 400 });
  }

  try {
    const retry = (payload as { retryOrderNumber?: unknown })?.retryOrderNumber;
    if (retry !== undefined && (typeof retry !== 'string' || !/^KHAN-[A-Z0-9-]{1,64}$/.test(retry))) {
      return NextResponse.json({ message: 'شماره سفارش معتبر نیست.' }, { status: 400 });
    }
    const upstream = await fetch(retry ? `${API_URL}/orders/${encodeURIComponent(retry as string)}/payment` : `${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ message: data.message ?? 'ثبت سفارش ناموفق بود.' }, { status: upstream.status });
    }
    const { receiptToken, order, paymentUrl } = data;
    if (typeof receiptToken !== 'string' || !receiptToken
      || typeof order?.orderNumber !== 'string' || !/^KHAN-[A-Z0-9-]{1,64}$/.test(order.orderNumber)
      || typeof paymentUrl !== 'string') throw new Error('invalid checkout response');

    const response = NextResponse.json({ order, paymentUrl });
    response.headers.set('Cache-Control', 'private, no-store');
    response.cookies.set(`khan_receipt_${order.orderNumber}`, receiptToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/checkout/callback',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'ارتباط با سرویس سفارش برقرار نشد. لطفاً دوباره تلاش کنید.' }, { status: 502 });
  }
}
