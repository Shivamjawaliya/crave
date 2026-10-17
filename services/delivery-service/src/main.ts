import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DeliveryService');
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const port = process.env.DELIVERY_SERVICE_PORT || 4005;
  await app.listen(port);
  logger.log(`🛵 Delivery Microservice running at http://localhost:${port}`);
}

bootstrap();
