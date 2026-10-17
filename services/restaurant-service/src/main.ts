import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('RestaurantService');
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const port = process.env.RESTAURANT_SERVICE_PORT || 4002;
  await app.listen(port);
  logger.log(`🍽️ Restaurant Microservice running at http://localhost:${port}`);
}

bootstrap();
