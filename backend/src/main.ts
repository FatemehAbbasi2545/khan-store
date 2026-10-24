import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Default ignores forwarded IP headers. Only enable the known proxy hop count
  // in a deployment that cannot be reached by bypassing that trusted proxy.
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(hops) || hops < 0 || hops > 5) throw new Error('Invalid TRUST_PROXY_HOPS');
  app.getHttpAdapter().getInstance().set('trust proxy', hops);

  const smallBody = json({ limit: '64kb' });
  const imageBody = json({ limit: '10mb' });
  app.use((req, res, next) => {
    const adminImages = /^\/admin\/(products|articles|greeting-cards)(\/|$)/.test(req.path);
    return (adminImages ? imageBody : smallBody)(req, res, next);
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Khan Store API listening on http://localhost:${port}`);
}
bootstrap();
