import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { OrdersService } from './orders.service';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getStats() {
    return this.ordersService.getDashboardStats();
  }
}
