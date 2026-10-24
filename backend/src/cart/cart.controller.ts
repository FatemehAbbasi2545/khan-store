import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create() {
    return this.cartService.createCart();
  }

  @Get(':token')
  get(@Param('token') token: string) {
    return this.cartService.getByToken(token);
  }

  @Post(':token/items')
  addItem(@Param('token') token: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(token, dto.productId, dto.quantity, {
      occasion: dto.occasion,
      greetingCard: dto.greetingCard,
      message: dto.message,
      isAnonymous: dto.isAnonymous,
    });
  }

  @Patch(':token/items/:itemId')
  updateItem(
    @Param('token') token: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(token, itemId, dto);
  }

  @Delete(':token/items/:itemId')
  removeItem(@Param('token') token: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(token, itemId);
  }
}
