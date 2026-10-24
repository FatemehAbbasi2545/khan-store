import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { assertAvailable, assertQuantity, lockCart, MAX_CART_LINES, MAX_TOTAL_TOMAN } from '../cart/cart-policy';
import { assertDelivery } from './delivery-policy';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { CreateOrderDto } from './dto/create-order.dto';

const DELIVERY_FEE_TOMAN = 150000;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private jwtService: JwtService,
  ) {}

  async createOrder(dto: CreateOrderDto, customerId?: string) {
    if (!customerId) throw new UnauthorizedException('برای نهایی کردن سفارش باید وارد حساب کاربری شوید.');
    // Enabled by default; an explicit "false" pauses online ordering.
    if (process.env.SHOP_ENABLED === 'false') {
      throw new ServiceUnavailableException(
        'ثبت سفارش آنلاین فعلاً غیرفعال است. برای سفارش با فروشگاه تماس بگیرید.',
      );
    }

    assertDelivery(dto.deliveryDate, dto.deliverySlot);
    const order = await this.prisma.$transaction(async (tx) => {
      const cart = await lockCart(tx, dto.cartToken);
      if (!cart.items.length || cart.items.length > MAX_CART_LINES) throw new BadRequestException('سبد خرید خالی است یا بیش از حد مجاز کالا دارد.');
      for (const item of cart.items) { assertQuantity(item.quantity); assertAvailable(item.product); }
      const total = cart.items.reduce((sum, item) => sum + item.product.priceToman * item.quantity, 0) + DELIVERY_FEE_TOMAN;
      if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_TOTAL_TOMAN) throw new BadRequestException('مبلغ سفارش معتبر نیست.');
      const checkoutKey = createHash('sha256').update(`${cart.id}:${cart.revision}`).digest('hex');
      const existing = await tx.order.findUnique({ where: { checkoutKey }, include: { items: true } });
      if (existing) {
        if (existing.customerId !== customerId) throw new ConflictException('این سبد قبلاً برای حساب دیگری ثبت شده است.');
        await tx.order.updateMany({ where: { id: existing.id, status: 'PENDING_PAYMENT', paymentRefId: null }, data: {
          customerName: dto.customerName, phone: dto.phone, address: dto.address, city: dto.city,
          deliveryDate: dto.deliveryDate, deliverySlot: dto.deliverySlot,
        } });
        return tx.order.findUniqueOrThrow({ where: { id: existing.id }, include: { items: true } });
      }
      return tx.order.create({ data: {
        checkoutKey, sourceCartId: cart.id, sourceCartRevision: cart.revision,
        orderNumber: `KHAN-${randomUUID().toUpperCase()}`,
        customerName: dto.customerName, phone: dto.phone, address: dto.address, city: dto.city,
        deliveryDate: dto.deliveryDate, deliverySlot: dto.deliverySlot, totalToman: total, customerId,
        items: { create: cart.items.map((item) => ({
          productId: item.productId, nameSnapshot: item.product.nameFa, priceSnapshot: item.product.priceToman,
          quantity: item.quantity, occasion: item.occasion, greetingCard: item.greetingCard,
          message: item.message, isAnonymous: item.isAnonymous,
        })) },
      }, include: { items: true } });
    });
    return this.startPayment(order);
  }

  async retryPayment(orderNumber: string, customerId: string) {
    const order = await this.prisma.order.findFirst({ where: { orderNumber, customerId }, include: { items: true } });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    assertDelivery(order.deliveryDate, order.deliverySlot);
    const products = await this.prisma.product.findMany({ where: { id: { in: order.items.map((item) => item.productId) } }, select: { id: true, stockStatus: true } });
    for (const item of order.items) { assertQuantity(item.quantity); assertAvailable(products.find((p) => p.id === item.productId) ?? null); }
    return this.startPayment(order);
  }

  private async startPayment(order: import('@prisma/client').Order) {
    if (process.env.SHOP_ENABLED === 'false') throw new ServiceUnavailableException('ثبت سفارش آنلاین فعلاً غیرفعال است.');
    if (order.status !== 'PENDING_PAYMENT' || order.paymentRefId) throw new BadRequestException('این سفارش قابل پرداخت نیست.');
    if (order.paymentAuthority) return { order, paymentUrl: this.paymentService.paymentUrl(order.paymentAuthority) };
    const startedAt = new Date();
    const claim = await this.prisma.order.updateMany({ where: {
      id: order.id, status: 'PENDING_PAYMENT', paymentAuthority: null,
      OR: [{ paymentRequestStartedAt: null }, { paymentRequestStartedAt: { lt: new Date(Date.now() - 120000) } }],
    }, data: { paymentRequestStartedAt: startedAt } });
    if (!claim.count) throw new ConflictException('درخواست پرداخت در حال آماده‌سازی است. چند لحظه بعد دوباره تلاش کنید.');
    try {
      const payment = await this.paymentService.requestPayment(order.totalToman, `پرداخت سفارش ${order.orderNumber} - گل خان`, order.orderNumber);
      const saved = await this.prisma.order.updateMany({ where: {
        id: order.id, status: 'PENDING_PAYMENT', paymentAuthority: null, paymentRequestStartedAt: startedAt,
      }, data: { paymentAuthority: payment.authority, paymentRequestStartedAt: null } });
      if (!saved.count) throw new ConflictException('وضعیت سفارش تغییر کرده است. دوباره بررسی کنید.');
      return { order: { ...order, paymentAuthority: payment.authority }, paymentUrl: payment.paymentUrl };
    } catch (error) {
      await this.prisma.order.updateMany({ where: { id: order.id, paymentAuthority: null, paymentRequestStartedAt: startedAt }, data: { paymentRequestStartedAt: null } });
      throw error;
    }
  }

  async handlePaymentCallback(orderNumber: string, authority: string, status: string) {
    if (typeof orderNumber !== 'string' || !orderNumber
      || typeof authority !== 'string' || !authority
      || typeof status !== 'string') {
      throw new BadRequestException('اطلاعات بازگشت پرداخت معتبر نیست.');
    }
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('سفارش یافت نشد');

    if (!order.paymentAuthority || authority !== order.paymentAuthority
      || authority.toUpperCase().startsWith('MOCK-')) {
      throw new BadRequestException('شناسه پرداخت با سفارش مطابقت ندارد.');
    }

    // Never let a replayed callback overwrite a finalized order.
    if (order.status !== 'PENDING_PAYMENT' || order.paymentRefId) return order;
    // Browser-provided Status is not proof of a failed bank transaction.
    if (status !== 'OK') return order;

    const { verified, refId } = await this.paymentService.verifyPayment(
      order.totalToman,
      authority,
    );

    if (!verified || !refId) return order;

    // Record payment and clear only an unchanged purchased snapshot together.
    return this.prisma.$transaction(async (tx) => {
      // Same cart-first lock order as checkout and cart writes avoids deadlocks.
      if (order.sourceCartId) await tx.cart.updateMany({ where: { id: order.sourceCartId }, data: { updatedAt: new Date() } });
      const paid = await tx.order.updateMany({ where: {
        id: order.id, status: 'PENDING_PAYMENT', paymentAuthority: authority, paymentRefId: null,
      }, data: { status: 'PROCESSING', paymentRefId: refId } });
      if (paid.count && order.sourceCartId && order.sourceCartRevision !== null) {
        const unchanged = await tx.cart.updateMany({ where: { id: order.sourceCartId, revision: order.sourceCartRevision }, data: { revision: { increment: 1 } } });
        if (unchanged.count) await tx.cartItem.deleteMany({ where: { cartId: order.sourceCartId } });
      }
      return tx.order.findUniqueOrThrow({ where: { id: order.id } });
    });
  }

  async findByOrderNumber(orderNumber: string, authHeader?: string) {
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('برای مشاهده سفارش، ورود یا دسترسی معتبر رسید لازم است.');
    }
    let principal: { role?: string; customerId?: string; orderId?: string; aud?: string };
    try {
      principal = this.jwtService.verify(authHeader.slice(7), { algorithms: ['HS256'] });
      if (!principal || !['customer', 'admin', 'order-receipt'].includes(principal.role ?? '')) {
        throw new Error('invalid role');
      }
      if (principal.role === 'customer' && (typeof principal.customerId !== 'string' || !principal.customerId)) {
        throw new Error('missing customer');
      }
      if (principal.role === 'order-receipt'
        && (principal.aud !== 'order-receipt' || typeof principal.orderId !== 'string' || !principal.orderId)) {
        throw new Error('invalid receipt');
      }
    } catch {
      throw new UnauthorizedException('دسترسی سفارش معتبر نیست یا منقضی شده است.');
    }

    // Ownership is part of the database query. Unauthorized and missing orders
    // receive the same response; this endpoint only returns receipt information.
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        ...(principal.role === 'customer' ? { customerId: principal.customerId } : {}),
        ...(principal.role === 'order-receipt' ? { id: principal.orderId } : {}),
      },
      select: { orderNumber: true, status: true, totalToman: true, paymentRefId: true },
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async updateStatus(id: string, status: string) {
    const exists = await this.prisma.order.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('سفارش یافت نشد');
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  async getDashboardStats() {
    const orders = await this.prisma.order.findMany({
      where: { status: { not: 'PENDING_PAYMENT' } },
      include: { items: true },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELED')
      .reduce((sum, o) => sum + o.totalToman, 0);

    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    }

    const productSales: Record<string, { name: string; quantity: number }> = {};
    for (const o of orders) {
      if (o.status === 'CANCELED') continue;
      for (const item of o.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.nameSnapshot, quantity: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
      }
    }
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { totalOrders, totalRevenue, statusCounts, topProducts };
  }
}
