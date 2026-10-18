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
import { InProcessCatalogService } from './in-process-catalog.service';

@ApiTags('Restaurants (API Gateway)')
@Controller('restaurants')
export class GatewayRestaurantsController {
  private restaurantServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly inProcessCatalog: InProcessCatalogService,
  ) {
    this.restaurantServiceUrl =
      this.configService.get<string>('RESTAURANT_SERVICE_URL') ||
      'http://localhost:4002';
  }

  @Get()
  @ApiOperation({ summary: 'List all approved restaurants with menus and items' })
  async getRestaurants(@Query('search') search?: string) {
    try {
      const url = search
        ? `${this.restaurantServiceUrl}/restaurants?search=${encodeURIComponent(search)}`
        : `${this.restaurantServiceUrl}/restaurants`;

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
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessCatalog.getRestaurants(search);
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
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessCatalog.getRestaurant(id);
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
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessCatalog.addCategory(restaurantId, body);
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
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessCatalog.addItem(categoryId, body);
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
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessCatalog.toggleAvailability(itemId, body);
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
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessCatalog.updateItem(itemId, body);
    }
  }
}
