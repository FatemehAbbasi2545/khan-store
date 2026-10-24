import { Matches, IsIn } from 'class-validator';
import { DELIVERY_SLOTS } from '../delivery-policy';
import { MaxLength } from 'class-validator';
import { IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MaxLength(128)
  cartToken: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  customerName: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  address: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  deliveryDate: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @IsIn(DELIVERY_SLOTS)
  deliverySlot: string;
}
