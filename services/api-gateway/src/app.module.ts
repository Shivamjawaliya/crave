import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { GatewaySocketGateway } from './proxy/gateway.gateway';
import { GatewayAuthController } from './auth/gateway-auth.controller';
import { GatewayRestaurantsController } from './restaurants/gateway-restaurants.controller';
import { GatewayUsersController } from './users/gateway-users.controller';
import { GatewayOrdersController } from './orders/gateway-orders.controller';
import { GatewayDeliveryController } from './delivery/gateway-delivery.controller';
import { OrderSseService } from './orders/order-sse.service';
import { PrismaModule } from './prisma/prisma.service';
import { InProcessAuthService } from './auth/in-process-auth.service';
import { InProcessCatalogService } from './restaurants/in-process-catalog.service';
import { InProcessOrdersService } from './orders/in-process-orders.service';
import { InProcessDeliveryService } from './delivery/in-process-delivery.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
  ],
  controllers: [
    HealthController,
    GatewayAuthController,
    GatewayRestaurantsController,
    GatewayUsersController,
    GatewayOrdersController,
    GatewayDeliveryController,
  ],
  providers: [
    GatewaySocketGateway,
    OrderSseService,
    InProcessAuthService,
    InProcessCatalogService,
    InProcessOrdersService,
    InProcessDeliveryService,
  ],
})
export class AppModule {}
