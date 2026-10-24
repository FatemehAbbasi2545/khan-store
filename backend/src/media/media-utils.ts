import { BadRequestException } from '@nestjs/common';
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export function mediaUrl(path: string) {
  return `${(process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/$/, '')}/media/${path}`;
}
export function publicImages(id: string, images: string[]) {
  return images.slice(0, 6).map((value, index) => value.startsWith('data:') ? mediaUrl(`products/${encodeURIComponent(id)}/${index}`) : value);
}
export function decodeImage(value: string) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new BadRequestException('تصویر معتبر نیست یا از ۳ مگابایت بزرگ‌تر است.');
  const bytes = Buffer.from(match[2], 'base64');
  const mime = match[1];
  const valid = mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : mime === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
    : mime === 'image/gif' ? /^GIF8[79]a/.test(bytes.subarray(0, 6).toString())
    : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!valid || bytes.length > MAX_IMAGE_BYTES) throw new BadRequestException('نوع یا محتوای تصویر معتبر نیست.');
  return { mime, bytes };
}
export function assertImage(value: string) {
  if (!value) return;
  if (value.startsWith('data:')) { decodeImage(value); return; }
  if (/^\/(?!\/)[A-Za-z0-9/_.-]+$/.test(value)) return;
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return; } catch {}
  throw new BadRequestException('آدرس تصویر باید HTTPS یا تصویر معتبر باشد.');
}
