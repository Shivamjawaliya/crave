import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.service';
import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class AppModule {}
