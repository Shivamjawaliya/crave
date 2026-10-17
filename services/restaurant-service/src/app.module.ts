import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.service';
import { RestaurantsService } from './restaurants/restaurants.service';
import { RestaurantsController } from './restaurants/restaurants.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    PrismaModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
})
export class AppModule {}
