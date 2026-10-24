import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertImage, mediaUrl } from '../media/media-utils';

@Injectable()
export class GreetingCardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1) {
    const cards = await this.prisma.greetingCard.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * 12, take: 12, select: { id: true, label: true, createdAt: true } });
    return cards.map((card) => ({ ...card, imageData: mediaUrl(`cards/${card.id}`) }));
  }

  create(imageData: string, label?: string) {
    assertImage(imageData);
    return this.prisma.greetingCard.create({ data: { imageData, label } });
  }

  async remove(id: string) {
    const exists = await this.prisma.greetingCard.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('کارت تبریک یافت نشد');
    await this.prisma.greetingCard.delete({ where: { id } });
    return { success: true };
  }
}
