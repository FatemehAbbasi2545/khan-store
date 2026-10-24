import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertImage, mediaUrl } from '../media/media-utils';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async findPublished(page = 1) {
    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * 12, take: 12,
      select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true },
    });
    return articles.map((article) => ({ ...article, coverImage: mediaUrl(`articles/${article.id}`) }));
  }

  async findPublishedBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('مقاله یافت نشد');
    }
    return { ...article, coverImage: article.coverImage?.startsWith('data:') ? mediaUrl(`articles/${article.id}`) : article.coverImage };
  }

  findAllForAdmin() {
    return this.prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOneForAdmin(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('مقاله یافت نشد');
    return article;
  }

  async create(data: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    status?: 'DRAFT' | 'PUBLISHED';
  }) {
    const existing = await this.prisma.article.findUnique({ where: { slug: data.slug } });
    if (data.coverImage) assertImage(data.coverImage);
    if (existing) throw new BadRequestException('این اسلاگ قبلاً استفاده شده است');

    return this.prisma.article.create({
      data: {
        ...data,
        status: data.status ?? 'DRAFT',
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      excerpt: string;
      content: string;
      coverImage: string;
      status: 'DRAFT' | 'PUBLISHED';
    }>,
  ) {
    const existing = await this.findOneForAdmin(id);
    if (data.coverImage) assertImage(data.coverImage);
    const becomingPublished = data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    return this.prisma.article.update({
      where: { id },
      data: {
        ...data,
        ...(becomingPublished ? { publishedAt: new Date() } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);
    await this.prisma.article.delete({ where: { id } });
    return { success: true };
  }
}
