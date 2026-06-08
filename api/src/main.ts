import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env['CORS_ORIGIN'] ?? 'http://localhost:4200';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  await app.listen(port);
  console.log(`API running on port ${port} (CORS: ${corsOrigin})`);
}

void bootstrap();
