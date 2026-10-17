import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Gateway Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Gateway health check' })
  check() {
    return {
      status: 'ok',
      service: 'api-gateway',
      microservices: {
        authService: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
        restaurantService: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:4002',
        orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
        paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004',
        deliveryService: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4005',
        notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
