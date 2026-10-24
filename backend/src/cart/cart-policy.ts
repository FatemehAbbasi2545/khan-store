import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export const MAX_QUANTITY = 99;
export const MAX_CART_LINES = 50;
export const MAX_TOTAL_TOMAN = 2000000000;

export function assertQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new BadRequestException('تعداد هر کالا باید بین ۱ تا ۹۹ باشد.');
  }
}

export function assertAvailable(product: { stockStatus: string } | null) {
  if (!product) throw new NotFoundException('محصول یافت نشد.');
  if (product.stockStatus === 'OUT_OF_STOCK') throw new BadRequestException('این محصول ناموجود است.');
}

// Every cart mutation and checkout locks the same cart row before reading items.
// The lock lives until this short database transaction commits; no bank call
// is made while holding it. Revision changes only when cart contents change.
export async function lockCart(tx: Prisma.TransactionClient, token: string) {
  const locked = await tx.cart.updateMany({ where: { token }, data: { updatedAt: new Date() } });
  if (!locked.count) throw new NotFoundException('سبد خرید یافت نشد');
  return tx.cart.findUniqueOrThrow({ where: { token }, include: { items: { include: { product: {
    select: { id: true, nameFa: true, priceToman: true, stockStatus: true },
  } } } } });
}
