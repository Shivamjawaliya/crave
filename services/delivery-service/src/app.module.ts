import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.service';
import { DeliveryService } from './delivery/delivery.service';
import { DeliveryController } from './delivery/delivery.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class AppModule {}
