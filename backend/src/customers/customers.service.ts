import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CaptchaService } from '../captcha/captcha.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private captchaService: CaptchaService,
  ) {}

  async register(name: string, phone: string, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new BadRequestException('رمز عبور و تکرار آن یکسان نیستند');
    }

    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      throw new BadRequestException('حسابی با این شماره تماس قبلاً ثبت شده است');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await this.prisma.customer.create({
      data: { name, phone, passwordHash },
    });

    return this.issueToken(customer.id, customer.name);
  }

  async login(phone: string, password: string, captchaToken: string, captchaAnswer: number) {
    if (!await this.captchaService.verify(captchaToken, captchaAnswer)) {
      throw new BadRequestException('پاسخ کد امنیتی اشتباه است');
    }

    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      throw new UnauthorizedException('شماره تماس یا رمز عبور اشتباه است');
    }
    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('شماره تماس یا رمز عبور اشتباه است');
    }
    return this.issueToken(customer.id, customer.name);
  }

  private issueToken(customerId: string, name: string) {
    const token = this.jwtService.sign({ role: 'customer', customerId });
    return { token, name };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, phone: true, createdAt: true },
    });
    if (!customer) throw new NotFoundException('حساب کاربری یافت نشد');
    return customer;
  }

  async getOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }
}
