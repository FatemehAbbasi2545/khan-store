import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(password: string) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || password !== adminPassword) {
      throw new UnauthorizedException('رمز عبور اشتباه است');
    }
    const token = this.jwtService.sign({ role: 'admin' });
    return { token };
  }
}
