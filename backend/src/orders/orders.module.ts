import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { OrdersService } from './orders.service';
import { PaymentModule } from '../payment/payment.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PaymentModule, AuthModule],
  controllers: [OrdersController, AdminOrdersController, AdminDashboardController],
  providers: [OrdersService],
})
export class OrdersModule {}
