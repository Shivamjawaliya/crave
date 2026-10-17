import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OrderService');
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const port = process.env.ORDER_SERVICE_PORT || 4003;
  await app.listen(port);
  logger.log(`📦 Order Microservice running at http://localhost:${port}`);
}

bootstrap();
