import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Food Delivery Platform — Microservices API Gateway')
    .setDescription(
      'Unified API Gateway routing client traffic to Auth, Restaurant, Order, Payment, and Delivery microservices.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.GATEWAY_PORT || 3001;
  await app.listen(port);
  logger.log(`🌐 API Gateway Microservice running at http://localhost:${port}/api/v1`);
  logger.log(`📚 Gateway Swagger Docs at http://localhost:${port}/api/docs`);
}

bootstrap();
