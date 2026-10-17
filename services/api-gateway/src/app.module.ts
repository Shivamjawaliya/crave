import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { GatewaySocketGateway } from './proxy/gateway.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
  ],
  controllers: [HealthController],
  providers: [GatewaySocketGateway],
})
export class AppModule {}
