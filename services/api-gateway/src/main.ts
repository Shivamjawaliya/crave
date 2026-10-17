import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

function autoStartMicroservices(logger: Logger) {
  if (process.env.MICROSERVICES_MANAGED === 'true') {
    logger.log('Microservices are externally managed. Skipping auto-start.');
    return;
  }

  const services = [
    { name: 'auth-service', script: 'services/auth-service/dist/main.js' },
    { name: 'restaurant-service', script: 'services/restaurant-service/dist/main.js' },
    { name: 'order-service', script: 'services/order-service/dist/main.js' },
    { name: 'delivery-service', script: 'services/delivery-service/dist/main.js' },
    { name: 'notification-service', script: 'services/notification-service/dist/main.js' },
    { name: 'payment-service', script: 'services/payment-service/dist/main.js' },
  ];

  const internalEnv = { ...process.env };
  delete internalEnv.PORT;

  for (const s of services) {
    const fullPath = path.resolve(process.cwd(), s.script);
    if (!fs.existsSync(fullPath)) {
      logger.warn(`Could not find ${fullPath}, skipping auto-start`);
      continue;
    }

    try {
      logger.log(`🚀 Auto-starting ${s.name}...`);
      const child = spawn(process.execPath, [fullPath], {
        stdio: 'inherit',
        env: internalEnv,
      });

      child.on('error', (err) => {
        logger.error(`[${s.name}] error: ${err.message}`);
      });

      child.on('exit', (code, sig) => {
        if (code !== 0 && code !== null) {
          logger.warn(`[${s.name}] exited with code ${code} (${sig})`);
        }
      });
    } catch (e: any) {
      logger.error(`Failed to auto-start ${s.name}: ${e.message}`);
    }
  }
}

async function bootstrap() {
  const logger = new Logger('APIGateway');

  // Auto-start internal microservices if they are not already managed
  autoStartMicroservices(logger);

  // Give microservices a moment to bind ports
  await new Promise((resolve) => setTimeout(resolve, 2000));

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

  const port = process.env.PORT || process.env.GATEWAY_PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`🌐 API Gateway Microservice running on port ${port}`);
  logger.log(`📚 Gateway Swagger Docs at http://localhost:${port}/api/docs`);
}

bootstrap();
