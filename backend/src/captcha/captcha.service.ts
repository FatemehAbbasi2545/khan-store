import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { requireJwtSecret } from '../auth/jwt-config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CaptchaService {
  constructor(private prisma: PrismaService) {}
  private get secret() {
    return requireJwtSecret(process.env.ADMIN_JWT_SECRET);
  }

  async generate() {
    const a = crypto.randomInt(1, 10);
    const b = crypto.randomInt(1, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const id = crypto.createHash('sha256').update(token).digest('hex');
    const answerHash = crypto.createHmac('sha256', this.secret).update(`${id}:${a + b}`).digest('hex');
    await this.prisma.captchaChallenge.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    await this.prisma.captchaChallenge.create({ data: { id, answerHash, expiresAt: new Date(Date.now() + 120000) } });
    return { question: `${a} + ${b} = ?`, token };
  }

  async verify(token: string, answer: number): Promise<boolean> {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !Number.isInteger(answer)) return false;
    const id = crypto.createHash('sha256').update(token).digest('hex');
    const challenge = await this.prisma.captchaChallenge.findUnique({ where: { id } });
    if (!challenge) return false;
    // A single atomic delete claims the challenge across all application replicas.
    const consumed = await this.prisma.captchaChallenge.deleteMany({ where: { id, expiresAt: { gt: new Date() } } });
    if (!consumed.count) return false;
    const expected = crypto.createHmac('sha256', this.secret).update(`${id}:${answer}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(challenge.answerHash));
  }
}
