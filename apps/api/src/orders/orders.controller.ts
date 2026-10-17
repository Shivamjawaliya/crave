import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@food-platform/shared-types';

@ApiTags('Orders (Customer)')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order from cart' })
  async createOrder(
    @CurrentUser('id') customerId: string,
    @Body()
    body: {
      restaurantId: string;
      address: {
        label?: string;
        addressLine: string;
        city?: string;
        state?: string;
        pincode?: string;
        latitude?: number;
        longitude?: number;
      };
      items: Array<{ menuItemId: string; quantity: number }>;
    },
  ) {
    return this.ordersService.createOrder(customerId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List customer order history' })
  async findMyOrders(@CurrentUser('id') customerId: string) {
    return this.ordersService.findCustomerOrders(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  async findOrderById(
    @Param('id') orderId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.findOrderById(orderId, userId, userRole);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel pending order' })
  async cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser('id') customerId: string,
  ) {
    return this.ordersService.cancelOrder(orderId, customerId);
  }
}
