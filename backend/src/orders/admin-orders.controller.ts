import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { OrdersService } from './orders.service';

class UpdateOrderStatusDto {
  @IsIn(['PENDING_PAYMENT', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'])
  status: string;
}

@Controller('admin/orders')
@UseGuards(AdminAuthGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAllForAdmin();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
