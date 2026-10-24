import { MaxLength } from 'class-validator';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PageDto } from '../common/page.dto';
import type { Request } from 'express';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { CustomerAuthGuard } from '../auth/customer-auth.guard';

class CreateReviewDto {
  @IsString()
  @MaxLength(128)
  orderId: string;

  @IsString()
  @MaxLength(128)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  findByProduct(@Param('productId') productId: string, @Query() query: PageDto) {
    return this.reviewsService.findByProduct(productId, query.page);
  }

  @Post('customers/me/reviews')
  @UseGuards(CustomerAuthGuard)
  create(@Req() req: Request & { customerId: string }, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.customerId, dto.orderId, dto.productId, dto.rating, dto.comment);
  }

  @Get('customers/me/reviewed-items')
  @UseGuards(CustomerAuthGuard)
  myReviewedItems(@Req() req: Request & { customerId: string }) {
    return this.reviewsService.findMyReviewedItems(req.customerId);
  }
}
