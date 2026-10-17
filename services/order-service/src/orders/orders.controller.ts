import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@food-platform/shared-types';

@ApiTags('Order Microservice')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Calculate server quote' })
  quote(@Body() body: { restaurantId: string; items: any[] }) {
    return this.ordersService.calculateQuote(body.restaurantId, body.items);
  }

  @Post()
  @ApiOperation({ summary: 'Create transactional order' })
  createOrder(@Body() body: { customerId: string; restaurantId: string; address: any; items: any[] }) {
    return this.ordersService.createOrder(body.customerId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOrder(@Param('id') id: string) {
    return this.ordersService.findOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order lifecycle' })
  updateStatus(@Param('id') id: string, @Body() body: { status: OrderStatus; actorId?: string }) {
    return this.ordersService.updateStatus(id, body.status, body.actorId);
  }
}
