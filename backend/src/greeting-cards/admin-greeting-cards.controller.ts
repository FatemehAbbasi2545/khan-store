import { MaxLength } from 'class-validator';
import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { GreetingCardsService } from './greeting-cards.service';

class CreateGreetingCardDto {
  @IsString()
  @MinLength(10)
  @MaxLength(4500000)
  imageData: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;
}

@Controller('admin/greeting-cards')
@UseGuards(AdminAuthGuard)
export class AdminGreetingCardsController {
  constructor(private readonly service: GreetingCardsService) {}

  @Post()
  create(@Body() dto: CreateGreetingCardDto) {
    return this.service.create(dto.imageData, dto.label);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
