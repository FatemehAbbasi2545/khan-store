import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { AuthModule } from '../auth/auth.module';
import { CaptchaModule } from '../captcha/captcha.module';

@Module({
  imports: [AuthModule, CaptchaModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
