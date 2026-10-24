import { Module } from '@nestjs/common';
import { GreetingCardsController } from './greeting-cards.controller';
import { AdminGreetingCardsController } from './admin-greeting-cards.controller';
import { GreetingCardsService } from './greeting-cards.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GreetingCardsController, AdminGreetingCardsController],
  providers: [GreetingCardsService],
})
export class GreetingCardsModule {}
