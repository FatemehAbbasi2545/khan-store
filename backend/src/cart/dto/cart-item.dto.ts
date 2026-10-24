import { Max } from 'class-validator';
import { MaxLength } from 'class-validator';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const OCCASIONS = ['BIRTHDAY', 'ANNIVERSARY', 'VALENTINE', 'MOTHERS_DAY', 'TEACHERS_DAY', 'CONDOLENCE'];

export class AddCartItemDto {
  @IsString()
  @MaxLength(128)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  @IsOptional()
  @IsIn(OCCASIONS)
  occasion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  greetingCard?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsOptional()
  @IsIn(OCCASIONS)
  occasion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  greetingCard?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
