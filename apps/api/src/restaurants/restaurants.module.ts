import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { OwnerRestaurantsController } from './owner-restaurants.controller';

@Module({
  controllers: [RestaurantsController, OwnerRestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
