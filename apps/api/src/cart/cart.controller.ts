import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService, CartItem } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Add or update item quantity in cart' })
  async updateItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body()
    body: {
      restaurantId: string;
      name: string;
      pricePaise: number;
      quantity: number;
    },
  ) {
    return this.cartService.updateItem(userId, body.restaurantId, {
      menuItemId: itemId,
      name: body.name,
      pricePaise: body.pricePaise,
      quantity: body.quantity,
    });
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }
}
