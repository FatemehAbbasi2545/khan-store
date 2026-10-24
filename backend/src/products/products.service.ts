import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { assertImage, mediaUrl, publicImages } from '../media/media-utils';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.search) {
      where.OR = [
        { nameFa: { contains: query.search, mode: 'insensitive' } },
        { nameScientific: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice || query.maxPrice) {
      where.priceToman = {
        gte: query.minPrice ? Number(query.minPrice) : undefined,
        lte: query.maxPrice ? Number(query.maxPrice) : undefined,
      };
    }

    if (query.light) where.light = query.light;
    if (query.careDifficulty) where.careDifficulty = query.careDifficulty;
    if (query.petSafe) where.petSafe = query.petSafe === 'true';
    if (query.airPurifying) where.airPurifying = query.airPurifying === 'true';
    if (query.suitableForOffice) where.suitableForOffice = query.suitableForOffice === 'true';

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { priceToman: 'asc' }
        : query.sort === 'price_desc'
        ? { priceToman: 'desc' }
        : { createdAt: 'desc' };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 12), take: query.limit ?? 12,
      select: { id: true, slug: true, nameFa: true, nameScientific: true, priceToman: true, stockStatus: true, category: true },
    });
    // Project only the first image's URL in PostgreSQL. Base64 blobs never
    // enter the list response (or the Node process for a catalog request).
    const images = products.length ? await this.prisma.$queryRaw<Array<{ id: string; image: string | null }>>(Prisma.sql`
      SELECT "id", CASE WHEN "images"[1] LIKE 'data:%' THEN '/media/products/' || "id" || '/0'
        ELSE "images"[1] END AS "image" FROM "Product" WHERE "id" IN (${Prisma.join(products.map((p) => p.id))})
    `) : [];
    return { count: await this.prisma.product.count({ where }), page: query.page ?? 1, limit: query.limit ?? 12,
      products: products.map((p) => {
        const image = images.find((row) => row.id === p.id)?.image;
        return { ...p, images: image ? [image.startsWith('/media/') ? mediaUrl(image.slice(7)) : image] : [] };
      }) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('محصول موردنظر یافت نشد');
    }

    const ratingAgg = await this.prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true,
    });

    return {
      ...product,
      images: publicImages(product.id, product.images),
      ratingAverage: ratingAgg._avg.rating ?? 0,
      ratingCount: ratingAgg._count,
    };
  }

  async findAllForAdmin() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async create(data: Prisma.ProductUncheckedCreateInput) {
    if (Array.isArray(data.images)) data.images.forEach(assertImage);
    return this.prisma.product.create({ data, include: { category: true } });
  }

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    if (Array.isArray(data.images)) data.images.forEach(assertImage);
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('محصول موردنظر یافت نشد');
    return this.prisma.product.update({ where: { id }, data, include: { category: true } });
  }

  async remove(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('محصول موردنظر یافت نشد');
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}
