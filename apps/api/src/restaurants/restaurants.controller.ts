import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { RestaurantStatus } from '@food-platform/shared-types';

@ApiTags('Restaurants (Public)')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Search approved restaurants' })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: RestaurantStatus,
  ) {
    return this.restaurantsService.findAll({ search, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant details' })
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Get(':id/menu')
  @ApiOperation({ summary: 'Get restaurant menu categories and items' })
  async getMenu(@Param('id') id: string) {
    const restaurant = await this.restaurantsService.findOne(id);
    return restaurant.categories;
  }
}
