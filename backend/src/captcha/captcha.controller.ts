import { Controller, Get, Header } from '@nestjs/common';
import { CaptchaService } from './captcha.service';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  generate() {
    return this.captchaService.generate();
  }
}
