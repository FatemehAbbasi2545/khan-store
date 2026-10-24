import type { JwtModuleOptions } from '@nestjs/jwt';

export function requireJwtSecret(secret: string | undefined): string {
  if (typeof secret !== 'string' || secret.trim().length < 32
    || ['khan-dev-secret-change-me', 'change-me-too-a-long-random-string'].includes(secret.trim())) {
    throw new Error('ADMIN_JWT_SECRET must be a unique secret of at least 32 characters.');
  }
  return secret;
}

export function jwtOptions(secret: string | undefined): JwtModuleOptions {
  return {
    secret: requireJwtSecret(secret),
    signOptions: { expiresIn: '30d', algorithm: 'HS256' },
    verifyOptions: { algorithms: ['HS256'] },
  };
}
