import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@food-platform/shared-types';

@ApiTags('Owner Menus')
@Controller('owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
@ApiBearerAuth()
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post('restaurants/:id/categories')
  @ApiOperation({ summary: 'Add a new menu category' })
  async addCategory(
    @Param('id') restaurantId: string,
    @CurrentUser('id') ownerId: string,
    @Body() body: { name: string; sortOrder?: number },
  ) {
    return this.menusService.addCategory(restaurantId, ownerId, body);
  }

  @Post('categories/:id/items')
  @ApiOperation({ summary: 'Add a menu item to a category' })
  async addItem(
    @Param('id') categoryId: string,
    @CurrentUser('id') ownerId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      pricePaise: number;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ) {
    return this.menusService.addItem(categoryId, ownerId, body);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Edit menu item' })
  async updateItem(
    @Param('id') itemId: string,
    @CurrentUser('id') ownerId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      pricePaise?: number;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ) {
    return this.menusService.updateItem(itemId, ownerId, body);
  }

  @Patch('items/:id/availability')
  @ApiOperation({ summary: 'Toggle menu item availability' })
  async toggleAvailability(
    @Param('id') itemId: string,
    @CurrentUser('id') ownerId: string,
    @Body() body: { isAvailable: boolean },
  ) {
    return this.menusService.toggleAvailability(itemId, ownerId, body.isAvailable);
  }
}
