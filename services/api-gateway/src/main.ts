import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Cookie parser middleware for httpOnly session cookies
  app.use(cookieParser());

  // Security Headers
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Restricted CORS configuration (supports credentials without wildcard '*')
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'https://35.226.137.38.sslip.io',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl) or matching allowed list
      if (!origin || defaultAllowedOrigins.includes(origin) || origin.endsWith('.sslip.io')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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
