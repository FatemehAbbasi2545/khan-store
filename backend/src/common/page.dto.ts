import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
export class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)
  limit: number = 12;
}
