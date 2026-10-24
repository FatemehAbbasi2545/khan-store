import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { PageDto } from '../../common/page.dto';
import { Matches, MaxLength } from 'class-validator';

export class QueryProductsDto extends PageDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,9}$/)
  minPrice?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,9}$/)
  maxPrice?: string;

  @IsOptional()
  @IsIn(['LOW', 'INDIRECT', 'DIRECT'])
  light?: 'LOW' | 'INDIRECT' | 'DIRECT';

  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  careDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional()
  @IsBooleanString()
  petSafe?: string;

  @IsOptional()
  @IsBooleanString()
  airPurifying?: string;

  @IsOptional()
  @IsBooleanString()
  suitableForOffice?: string;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort?: 'newest' | 'price_asc' | 'price_desc';
}
