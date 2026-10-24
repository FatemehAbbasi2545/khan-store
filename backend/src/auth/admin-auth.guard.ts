import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('ورود لازم است');
    }

    const token = authHeader.slice(7);
    try {
      const payload: any = this.jwtService.verify(token);
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('دسترسی مدیریتی لازم است');
      }
      return true;
    } catch {
      throw new UnauthorizedException('نشست منقضی شده، دوباره وارد شوید');
    }
  }
}
