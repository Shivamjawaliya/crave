import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Restaurants (API Gateway)')
@Controller('restaurants')
export class GatewayRestaurantsController {
  private restaurantServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.restaurantServiceUrl =
      this.configService.get<string>('RESTAURANT_SERVICE_URL') ||
      'http://localhost:4002';
  }

  @Get()
  @ApiOperation({ summary: 'List all approved restaurants with menus and items' })
  async getRestaurants(
    @Query('search') search?: string,
    @Query('openOnly') openOnly?: string,
    @Query('isAcceptingOrders') isAcceptingOrders?: string,
  ) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (openOnly) params.append('openOnly', openOnly);
      if (isAcceptingOrders) params.append('isAcceptingOrders', isAcceptingOrders);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const url = `${this.restaurantServiceUrl}/restaurants${queryStr}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(
          data.message || 'Failed to fetch restaurants',
          response.status,
        );
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Restaurant service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single restaurant and full categorized menu' })
  async getRestaurant(@Param('id') id: string) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(
          data.message || 'Restaurant not found',
          response.status,
        );
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Restaurant service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post(':id/categories')
  @ApiOperation({ summary: 'Add menu category to restaurant' })
  async addCategory(@Param('id') restaurantId: string, @Body() body: any) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/${restaurantId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new HttpException(data.message || 'Failed to add category', response.status);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Restaurant service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Post('categories/:id/items')
  @ApiOperation({ summary: 'Add menu item to category' })
  async addItem(@Param('id') categoryId: string, @Body() body: any) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/categories/${categoryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new HttpException(data.message || 'Failed to add item', response.status);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Restaurant service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Patch('items/:id/availability')
  @ApiOperation({ summary: 'Toggle item availability in real-time' })
  async toggleAvailability(@Param('id') itemId: string, @Body() body: any) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/items/${itemId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new HttpException(data.message || 'Failed to toggle availability', response.status);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Restaurant service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update menu item details' })
  async updateItem(@Param('id') itemId: string, @Body() body: any) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new HttpException(data.message || 'Failed to update item', response.status);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Restaurant service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Patch(':id/orders-status')
  @ApiOperation({ summary: 'Toggle restaurant accepting orders' })
  async toggleOrdersStatus(
    @Param('id') id: string,
    @Body() body: { isAcceptingOrders: boolean },
  ) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/${id}/orders-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new HttpException(data.message || 'Failed to toggle accepting orders', response.status);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Restaurant service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update restaurant status' })
  async updateRestaurantStatus(
    @Param('id') id: string,
    @Body() body: { status?: any; isAcceptingOrders?: boolean },
  ) {
    try {
      const response = await fetch(`${this.restaurantServiceUrl}/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new HttpException(data.message || 'Failed to update status', response.status);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Restaurant service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
