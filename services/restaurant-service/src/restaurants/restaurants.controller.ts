import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';

@ApiTags('Restaurant Microservice')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Search all approved restaurants' })
  findAll(
    @Query('search') search?: string,
    @Query('openOnly') openOnly?: string,
    @Query('isAcceptingOrders') isAcceptingOrders?: string,
  ) {
    const onlyOpen = openOnly === 'true' || isAcceptingOrders === 'true';
    return this.restaurantsService.findAll(search, onlyOpen ? true : undefined);
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

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update item details' })
  updateItem(@Param('id') itemId: string, @Body() body: any) {
    return this.restaurantsService.updateItem(itemId, body);
  }

  @Patch(':id/orders-status')
  @ApiOperation({ summary: 'Toggle restaurant accepting orders' })
  updateOrdersStatus(
    @Param('id') id: string,
    @Body() body: { isAcceptingOrders: boolean },
  ) {
    return this.restaurantsService.updateAcceptingOrders(id, body.isAcceptingOrders);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update restaurant status or accepting orders' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status?: any; isAcceptingOrders?: boolean },
  ) {
    return this.restaurantsService.updateStatus(id, body);
  }
}
