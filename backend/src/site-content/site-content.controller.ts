import { Body, Controller, Get, NotFoundException, Param, Put, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { SiteContentService } from './site-content.service';

// Only these page texts can be read/edited through this API.
const ALLOWED_KEYS = ['about', 'story', 'values'];

class UpdateSiteContentDto {
  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  value: string;
}

function assertAllowed(key: string) {
  if (!ALLOWED_KEYS.includes(key)) throw new NotFoundException('محتوا یافت نشد');
}

@Controller()
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  @Get('site-content/:key')
  get(@Param('key') key: string) {
    assertAllowed(key);
    return this.service.get(key);
  }

  @Put('admin/site-content/:key')
  @UseGuards(AdminAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateSiteContentDto) {
    assertAllowed(key);
    return this.service.upsert(key, dto.value);
  }
}
