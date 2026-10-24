import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  create(name: string, phone: string, email: string, message: string) {
    return this.prisma.contactMessage.create({ data: { name, phone, email, message } });
  }

  findAll() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, status: string) {
    const exists = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('پیام یافت نشد');
    return this.prisma.contactMessage.update({ where: { id }, data: { status: status as any } });
  }
}
