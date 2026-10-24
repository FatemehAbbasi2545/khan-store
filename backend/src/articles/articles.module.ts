import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { AdminArticlesController } from './admin-articles.controller';
import { ArticlesService } from './articles.service';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ArticlesController, AdminArticlesController],
  providers: [ArticlesService, AiService],
})
export class ArticlesModule {}
