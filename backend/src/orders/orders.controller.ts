import { Body, Controller, Get, Header, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CustomerAuthGuard } from '../auth/customer-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(CustomerAuthGuard)
  @Header('Cache-Control', 'private, no-store')
  async create(@Body() dto: CreateOrderDto, @Req() req: Request & { customerId: string }) {
    const result = await this.ordersService.createOrder(dto, req.customerId);
    return this.withReceipt(result);
  }

  @Post(':orderNumber/payment')
  @UseGuards(CustomerAuthGuard)
  @Header('Cache-Control', 'private, no-store')
  async retry(@Param('orderNumber') orderNumber: string, @Req() req: Request & { customerId: string }) {
    return this.withReceipt(await this.ordersService.retryPayment(orderNumber, req.customerId));
  }

  private withReceipt(result: { order: { id: string }; paymentUrl: string }) {
    // This capability grants only a receipt for this order, never an account or
    // customer details. The frontend keeps it in an HttpOnly cookie, not a URL.
    const receiptToken = this.jwtService.sign(
      { role: 'order-receipt', orderId: result.order.id },
      { expiresIn: '7d', audience: 'order-receipt', algorithm: 'HS256' },
    );
    return { ...result, receiptToken };
  }

  @Get('payment/callback')
  async paymentCallback(
    @Query('order') order: string,
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Res() res: Response,
  ) {
    const updated = await this.ordersService.handlePaymentCallback(order, authority, status);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const result = updated.paymentRefId
      && ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(updated.status) ? 'success' : 'failed';
    const redirectUrl = new URL('/checkout/callback', frontendUrl);
    redirectUrl.searchParams.set('order', order);
    redirectUrl.searchParams.set('result', result);
    return res.redirect(redirectUrl.toString());
  }

  @Get(':orderNumber')
  @Header('Cache-Control', 'private, no-store')
  findOne(@Param('orderNumber') orderNumber: string, @Headers('authorization') authHeader?: string) {
    return this.ordersService.findByOrderNumber(orderNumber, authHeader);
  }
}
