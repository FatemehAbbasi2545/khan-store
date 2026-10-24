import { BadRequestException } from '@nestjs/common';
export const DELIVERY_SLOTS = ['۹ تا ۱۲', '۱۲ تا ۱۵', '۱۵ تا ۱۸', '۱۸ تا ۲۱'];
export function assertDelivery(date: string, slot: string, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const parsed = new Date(`${date}T00:00:00Z`);
  const first = new Date(`${today}T00:00:00Z`).getTime();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== date || parsed.getTime() < first
    || parsed.getTime() > first + 30 * 86400000 || !DELIVERY_SLOTS.includes(slot)) {
    throw new BadRequestException('تاریخ تحویل باید از امروز تا ۳۰ روز آینده و بازه تحویل معتبر باشد.');
  }
}
