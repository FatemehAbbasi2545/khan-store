import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
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
      if (payload.role !== 'customer' || typeof payload.customerId !== 'string' || !payload.customerId) {
        throw new UnauthorizedException('ورود مشتری لازم است');
      }
      request.customerId = payload.customerId;
      return true;
    } catch {
      throw new UnauthorizedException('نشست منقضی شده، دوباره وارد شوید');
    }
  }
}

// Reads a customer JWT if present, but never throws — used for endpoints that
// stay public (guest checkout) while still linking the order to an account
// when the shopper happens to be logged in.
export function tryExtractCustomerId(jwtService: JwtService, authHeader?: string): string | undefined {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  try {
    const payload: any = jwtService.verify(authHeader.slice(7));
    return payload.role === 'customer' ? payload.customerId : undefined;
  } catch {
    return undefined;
  }
}
