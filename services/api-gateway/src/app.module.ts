import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { GatewaySocketGateway } from './proxy/gateway.gateway';
import { GatewayAuthController } from './auth/gateway-auth.controller';
import { GatewayRestaurantsController } from './restaurants/gateway-restaurants.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
  ],
  controllers: [
    HealthController,
    GatewayAuthController,
    GatewayRestaurantsController,
  ],
  providers: [GatewaySocketGateway],
})
export class AppModule {}
