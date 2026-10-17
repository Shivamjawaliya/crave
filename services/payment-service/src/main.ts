import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const port = process.env.PAYMENT_SERVICE_PORT || 4004;
  await app.listen(port);
  logger.log(`💳 Payment Microservice running at http://localhost:${port}`);
}

bootstrap();
