import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ArticlesService } from './articles.service';
import { AiService } from './ai.service';
import { CreateArticleDto, UpdateArticleDto, GenerateArticleDto } from './dto/article.dto';

@Controller('admin/articles')
@UseGuards(AdminAuthGuard)
export class AdminArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  findAll() {
    return this.articlesService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOneForAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateArticleDto) {
    return this.aiService.generateArticleDraft(dto.topic);
  }
}
