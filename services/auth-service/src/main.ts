import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AuthService');
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const port = process.env.AUTH_SERVICE_PORT || 4001;
  await app.listen(port);
  logger.log(`🔐 Auth Microservice running at http://localhost:${port}`);
}

bootstrap();
