import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@food-platform/shared-types';

@ApiTags('Owner Restaurants')
@Controller('owner/restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
@ApiBearerAuth()
export class OwnerRestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all restaurants owned by the current user' })
  async findMyRestaurants(@CurrentUser('id') ownerId: string) {
    return this.restaurantsService.findOwnerRestaurants(ownerId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant application' })
  async createRestaurant(
    @CurrentUser('id') ownerId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      address: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.restaurantsService.createRestaurant(ownerId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update restaurant details' })
  async updateRestaurant(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.restaurantsService.updateRestaurant(id, ownerId, body);
  }
}
