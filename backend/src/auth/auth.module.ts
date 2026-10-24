import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtOptions } from './jwt-config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { CustomerAuthGuard } from './customer-auth.guard';

// One JWT secret is shared between admin and customer tokens; the "role"
// field inside each token's payload (checked by the two guards) keeps them
// from being used interchangeably.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => jwtOptions(config.get<string>('ADMIN_JWT_SECRET')),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard, CustomerAuthGuard],
  exports: [JwtModule, AdminAuthGuard, CustomerAuthGuard],
})
export class AuthModule {}
