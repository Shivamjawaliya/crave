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
    'https://crave-restaurant-dashboard.vercel.app',
    'https://crave-delivery-dashboard.vercel.app',
    'https://crave-admin-dashboard.vercel.app',
    'https://crave-blue.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
  ];

  const isOriginAllowed = (origin?: string): boolean => {
    if (!origin) return true; // Server-to-server, curl, Postman, mobile app
    if (defaultAllowedOrigins.includes(origin)) return true;
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      if (
        hostname.endsWith('.vercel.app') ||
        hostname.endsWith('.sslip.io') ||
        hostname.endsWith('.onrender.com') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        return true;
      }
    } catch {
      // Non-standard origin
    }
    return false;
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        // Express CORS echoes the exact origin; necessary when credentials: true
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie',
      'x-access-token',
    ],
    maxAge: 86400,
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
