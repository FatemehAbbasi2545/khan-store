import { Controller, Get, Query } from '@nestjs/common';
import { PageDto } from '../common/page.dto';
import { GreetingCardsService } from './greeting-cards.service';

@Controller('greeting-cards')
export class GreetingCardsController {
  constructor(private readonly service: GreetingCardsService) {}

  @Get()
  findAll(@Query() query: PageDto) {
    return this.service.findAll(query.page);
  }
}
