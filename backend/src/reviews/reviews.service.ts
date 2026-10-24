import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, orderId: string, productId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('امتیاز باید بین ۱ تا ۵ باشد');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.customerId !== customerId) {
      throw new BadRequestException('این سفارش متعلق به شما نیست');
    }
    if (!order.items.some((i) => i.productId === productId)) {
      throw new BadRequestException('این محصول در سفارش شما نبوده است');
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('فقط پس از تحویل سفارش می‌توانید نظر ثبت کنید');
    }

    return this.prisma.review.upsert({
      where: { customerId_productId_orderId: { customerId, productId, orderId } },
      update: { rating, comment },
      create: { customerId, productId, orderId, rating, comment },
    });
  }

  async findByProduct(productId: string, page = 1) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * 12, take: 12,
      select: { id: true, rating: true, comment: true, createdAt: true, customer: { select: { name: true } } },
    });
    const aggregate = await this.prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
    return { reviews, average: aggregate._avg.rating ?? 0, count: aggregate._count };
  }

  async findMyReviewedItems(customerId: string) {
    const reviews = await this.prisma.review.findMany({ where: { customerId } });
    return reviews.map((r) => `${r.orderId}:${r.productId}`);
  }
}
