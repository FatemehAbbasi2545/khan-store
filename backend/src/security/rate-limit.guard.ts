import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const path = req.path as string;
    const login = /\/(?:auth\/login|customers\/login|customers\/register)$/.test(path);
    const sensitive = login || path === '/captcha' || path === '/contact'
      || (req.method !== 'GET' && /^\/(cart|orders)(\/|$)/.test(path))
      || path === '/orders/payment/callback' || path.startsWith('/media/')
      || /^\/(cart|products|articles|categories|greeting-cards|site-content|customers\/me)(\/|$)/.test(path);
    if (!sensitive) return true;
    const limit = login ? 10 : path === '/contact' ? 5 : path === '/captcha' ? 20 : 120;
    const now = Date.now();
    const window = Math.floor(now / 60000);
    const scopes = [`ip:${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}:${path.split('/')[1]}:${login ? 'login' : req.method}`];
    if (login && typeof req.body?.phone === 'string') scopes.push(`account:${req.body.phone.trim()}`);
    for (const scope of scopes) {
      const id = createHash('sha256').update(`${window}:${scope}`).digest('hex');
      const bucket = await this.prisma.rateLimitBucket.upsert({
        where: { id }, create: { id, count: 1, expiresAt: new Date((window + 2) * 60000) }, update: { count: { increment: 1 } },
      });
      if (bucket.count > limit) {
        res.setHeader('Retry-After', String(60 - Math.floor(now / 1000) % 60));
        throw new HttpException('درخواست‌های زیادی ارسال شده است. کمی بعد دوباره تلاش کنید.', 429);
      }
    }
    // Bounded retention in the shared database (not a per-process memory map).
    if (Math.random() < 0.02) await this.prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
    return true;
  }
}
