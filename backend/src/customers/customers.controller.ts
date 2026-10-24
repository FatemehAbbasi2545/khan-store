import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CustomersService } from './customers.service';
import { RegisterCustomerDto, LoginCustomerDto } from './dto/customer-auth.dto';
import { CustomerAuthGuard } from '../auth/customer-auth.guard';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('register')
  register(@Body() dto: RegisterCustomerDto) {
    return this.customersService.register(dto.name, dto.phone, dto.password, dto.confirmPassword);
  }

  @Post('login')
  login(@Body() dto: LoginCustomerDto) {
    return this.customersService.login(dto.phone, dto.password, dto.captchaToken, dto.captchaAnswer);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  getProfile(@Req() req: Request & { customerId: string }) {
    return this.customersService.getProfile(req.customerId);
  }

  @Get('me/orders')
  @UseGuards(CustomerAuthGuard)
  getOrders(@Req() req: Request & { customerId: string }) {
    return this.customersService.getOrders(req.customerId);
  }
}
