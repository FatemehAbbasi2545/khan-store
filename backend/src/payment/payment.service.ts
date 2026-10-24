import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

const PLACEHOLDER_MERCHANT_ID = '00000000-0000-0000-0000-000000000000';
const REQUEST_TIMEOUT_MS = 15000;

@Injectable()
export class PaymentService {
  private get sandbox() {
    return process.env.ZARINPAL_SANDBOX === 'true';
  }

  private get merchantId() {
    return process.env.ZARINPAL_MERCHANT_ID?.trim() ?? '';
  }

  private assertConfigured() {
    if (!this.merchantId || this.merchantId === PLACEHOLDER_MERCHANT_ID) {
      throw new ServiceUnavailableException('درگاه پرداخت تنظیم نشده است. با فروشگاه تماس بگیرید.');
    }
    if (this.sandbox && !['development', 'test'].includes(process.env.NODE_ENV ?? '')) {
      throw new ServiceUnavailableException('درگاه آزمایشی در محیط تولید مجاز نیست.');
    }
  }

  private amountRial(amountToman: number) {
    const amount = amountToman * 10;
    if (!Number.isSafeInteger(amountToman) || amountToman <= 0 || !Number.isSafeInteger(amount)) {
      throw new BadRequestException('مبلغ پرداخت معتبر نیست.');
    }
    return amount;
  }

  private validAuthority(authority: unknown): authority is string {
    return typeof authority === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(authority)
      && !authority.toUpperCase().startsWith('MOCK-');
  }

  private get baseUrl() {
    return this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://payment.zarinpal.com/pg/v4/payment';
  }

  private get gatewayBaseUrl() {
    return this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  paymentUrl(authority: string) {
    this.assertConfigured();
    if (!this.validAuthority(authority)) throw new BadRequestException('شناسه پرداخت معتبر نیست.');
    return `${this.gatewayBaseUrl}/${encodeURIComponent(authority)}`;
  }

  async requestPayment(amountToman: number, description: string, orderNumber: string) {
    this.assertConfigured();
    const amount = this.amountRial(amountToman);
    let callbackUrl: URL;
    try {
      callbackUrl = new URL(process.env.ZARINPAL_CALLBACK_URL ?? '');
      if (!['http:', 'https:'].includes(callbackUrl.protocol)
        || (process.env.NODE_ENV === 'production' && callbackUrl.protocol !== 'https:')
        || callbackUrl.username || callbackUrl.password) throw new Error('invalid callback URL');
      callbackUrl.searchParams.set('order', orderNumber);
    } catch {
      throw new ServiceUnavailableException('آدرس بازگشت درگاه پرداخت معتبر نیست.');
    }
    try {
      const { data } = await axios.post(`${this.baseUrl}/request.json`, {
        merchant_id: this.merchantId,
        amount,
        description,
        callback_url: callbackUrl.toString(),
      }, { timeout: REQUEST_TIMEOUT_MS });
      const authority = data?.data?.authority;
      if (data?.data?.code !== 100 || !this.validAuthority(authority)) {
        throw new Error('gateway rejected payment request');
      }
      return { authority, paymentUrl: `${this.gatewayBaseUrl}/${encodeURIComponent(authority)}` };
    } catch {
      // Fail closed: a gateway outage must never simulate a successful payment.
      throw new ServiceUnavailableException('ارتباط با درگاه پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.');
    }
  }

  async verifyPayment(amountToman: number, authority: string) {
    if (!this.validAuthority(authority)) return { verified: false, refId: null };
    this.assertConfigured();
    const amount = this.amountRial(amountToman);
    try {
      const { data } = await axios.post(`${this.baseUrl}/verify.json`, {
        merchant_id: this.merchantId,
        amount,
        authority,
      }, { timeout: REQUEST_TIMEOUT_MS });
      const result = data?.data;
      const refId = result?.ref_id;
      const validRefId = (typeof refId === 'string' && /^[1-9]\d*$/.test(refId))
        || (typeof refId === 'number' && Number.isSafeInteger(refId) && refId > 0);
      if ((result?.code === 100 || result?.code === 101) && validRefId) {
        return { verified: true, refId: String(refId) };
      }
      return { verified: false, refId: null };
    } catch {
      throw new ServiceUnavailableException('تأیید پرداخت فعلاً ممکن نیست. لطفاً دوباره تلاش کنید.');
    }
  }
}
