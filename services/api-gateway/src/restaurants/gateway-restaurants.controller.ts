import {
  Controller,
  Get,
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
}
