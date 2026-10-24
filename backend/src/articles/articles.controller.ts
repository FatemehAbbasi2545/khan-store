import { Controller, Get, Param, Query } from '@nestjs/common';
import { PageDto } from '../common/page.dto';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll(@Query() query: PageDto) {
    return this.articlesService.findPublished(query.page);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findPublishedBySlug(slug);
  }
}
