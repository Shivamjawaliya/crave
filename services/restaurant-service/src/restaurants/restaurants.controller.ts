import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';

@ApiTags('Restaurant Microservice')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Search all approved restaurants' })
  findAll(@Query('search') search?: string) {
    return this.restaurantsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant and menu' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create restaurant application' })
  createRestaurant(@Body() body: any) {
    return this.restaurantsService.createRestaurant(body);
  }

  @Post(':id/categories')
  @ApiOperation({ summary: 'Add menu category' })
  addCategory(@Param('id') restaurantId: string, @Body() body: { name: string; sortOrder?: number }) {
    return this.restaurantsService.addCategory(restaurantId, body.name, body.sortOrder);
  }

  @Post('categories/:id/items')
  @ApiOperation({ summary: 'Add menu item' })
  addItem(@Param('id') categoryId: string, @Body() body: any) {
    return this.restaurantsService.addItem(categoryId, body);
  }

  @Patch('items/:id/availability')
  @ApiOperation({ summary: 'Toggle item availability' })
  toggleItem(@Param('id') itemId: string, @Body() body: { isAvailable: boolean }) {
    return this.restaurantsService.toggleItemAvailability(itemId, body.isAvailable);
  }
}
