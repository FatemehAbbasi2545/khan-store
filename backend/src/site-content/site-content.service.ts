import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteContentService {
  constructor(private prisma: PrismaService) {}

  async get(key: string) {
    const row = await this.prisma.siteContent.findUnique({ where: { key } });
    return { key, value: row?.value ?? null };
  }

  async upsert(key: string, value: string) {
    const row = await this.prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return { key: row.key, value: row.value };
  }
}
