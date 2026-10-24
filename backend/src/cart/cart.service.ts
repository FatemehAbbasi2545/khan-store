import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { assertAvailable, assertQuantity, lockCart, MAX_CART_LINES, MAX_TOTAL_TOMAN } from './cart-policy';
import { BadRequestException } from '@nestjs/common';
import { mediaUrl } from '../media/media-utils';
import { PrismaService } from '../prisma/prisma.service';

const CART_INCLUDE = {
  items: { include: { product: { select: { id: true, slug: true, nameFa: true, priceToman: true, stockStatus: true } } } },
} as const;

interface GiftOptions {
  occasion?: string;
  greetingCard?: string;
  message?: string;
  isAnonymous?: boolean;
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async createCart() {
    const cart = await this.prisma.cart.create({
      data: { token: randomUUID() },
      include: CART_INCLUDE,
    });
    return this.serialize(cart);
  }

  async getByToken(token: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { token },
      include: CART_INCLUDE,
    });
    if (!cart) throw new NotFoundException('سبد خرید یافت نشد');
    return this.serialize(cart);
  }

  async addItem(token: string, productId: string, quantity: number, gift?: GiftOptions) {
    assertQuantity(quantity);
    return this.prisma.$transaction(async (tx) => {
      const cart = await lockCart(tx, token);
      const product = await tx.product.findUnique({ where: { id: productId }, select: { stockStatus: true } });
      assertAvailable(product);
      const existing = gift?.occasion ? null : await tx.cartItem.findFirst({ where: { cartId: cart.id, productId, occasion: null } });
      if (existing) {
        assertQuantity(existing.quantity + quantity);
        await tx.cartItem.updateMany({ where: { id: existing.id, cartId: cart.id }, data: { quantity: { increment: quantity } } });
      } else {
        if (cart.items.length >= MAX_CART_LINES) throw new BadRequestException('حداکثر ۵۰ ردیف در سبد مجاز است.');
        await tx.cartItem.create({ data: { cartId: cart.id, productId, quantity,
          occasion: gift?.occasion as any, greetingCard: gift?.greetingCard,
          message: gift?.message, isAnonymous: gift?.isAnonymous ?? false } });
      }
      await tx.cart.update({ where: { id: cart.id }, data: { revision: { increment: 1 } } });
      return this.serialize(await tx.cart.findUniqueOrThrow({ where: { token }, include: CART_INCLUDE }));
    });
  }

  async updateItem(token: string, itemId: string, data: { quantity?: number } & GiftOptions) {
    if (data.quantity !== undefined) assertQuantity(data.quantity);
    return this.prisma.$transaction(async (tx) => {
      const cart = await lockCart(tx, token);
      const item = await tx.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { product: { select: { stockStatus: true } } } });
      if (!item) throw new NotFoundException('آیتم سبد خرید یافت نشد');
      if (data.quantity !== undefined) assertAvailable(item.product);
      const result = await tx.cartItem.updateMany({ where: { id: itemId, cartId: cart.id }, data: {
        quantity: data.quantity, occasion: data.occasion as any, greetingCard: data.greetingCard,
        message: data.message, isAnonymous: data.isAnonymous,
      } });
      if (!result.count) throw new NotFoundException('آیتم سبد خرید یافت نشد');
      await tx.cart.update({ where: { id: cart.id }, data: { revision: { increment: 1 } } });
      return this.serialize(await tx.cart.findUniqueOrThrow({ where: { token }, include: CART_INCLUDE }));
    });
  }

  async removeItem(token: string, itemId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await lockCart(tx, token);
      const result = await tx.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
      if (!result.count) throw new NotFoundException('آیتم سبد خرید یافت نشد');
      await tx.cart.update({ where: { id: cart.id }, data: { revision: { increment: 1 } } });
      return this.serialize(await tx.cart.findUniqueOrThrow({ where: { token }, include: CART_INCLUDE }));
    });
  }

  private serialize(cart: any) {
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.product.priceToman * item.quantity,
      0,
    );
    if (!Number.isSafeInteger(subtotal) || subtotal < 0 || subtotal > MAX_TOTAL_TOMAN) {
      throw new BadRequestException('مبلغ سبد از سقف مجاز بیشتر است.');
    }
    return { ...cart, items: cart.items.map((item: any) => ({ ...item, product: { ...item.product,
      images: item.product.id ? [mediaUrl(`products/${item.product.id}/0`)] : [],
    } })), subtotalToman: subtotal };
  }
}
