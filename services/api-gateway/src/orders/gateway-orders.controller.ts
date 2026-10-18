import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { OrderSseService } from './order-sse.service';
import { InProcessOrdersService } from './in-process-orders.service';

@ApiTags('Orders (API Gateway)')
@Controller('orders')
export class GatewayOrdersController {
  private orderServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly orderSseService: OrderSseService,
    private readonly inProcessOrders: InProcessOrdersService,
  ) {
    this.orderServiceUrl =
      this.configService.get<string>('ORDER_SERVICE_URL') ||
      'http://localhost:4003';
  }

  @Post('quote')
  @ApiOperation({ summary: 'Calculate server order quote' })
  async quote(@Body() body: { restaurantId: string; items: any[] }) {
    try {
      const response = await fetch(`${this.orderServiceUrl}/orders/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Quote calculation failed', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.calculateQuote(body.restaurantId, body.items);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Place a transactional customer order' })
  async createOrder(
    @Body()
    body: {
      customerId: string;
      restaurantId: string;
      address: any;
      items: any[];
    },
  ) {
    try {
      const response = await fetch(`${this.orderServiceUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Order creation failed', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.createOrder(body.customerId, body);
    }
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all past orders for a customer' })
  async getCustomerOrders(@Param('customerId') customerId: string) {
    try {
      const response = await fetch(
        `${this.orderServiceUrl}/orders/customer/${customerId}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch customer orders', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.getCustomerOrders(customerId);
    }
  }

  @Get('customer/:customerId/live')
  @ApiOperation({ summary: 'Server-Sent Events (SSE) live order tracking stream for customer' })
  streamCustomerOrders(
    @Param('customerId') customerId: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    this.orderSseService.addCustomerClient(customerId, res);
  }

  @Get(':id/live')
  @ApiOperation({ summary: 'Server-Sent Events (SSE) live order tracking stream for single order' })
  streamOrder(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    this.orderSseService.addOrderClient(id, res);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get all live orders for a restaurant' })
  async getRestaurantOrders(@Param('restaurantId') restaurantId: string) {
    try {
      const response = await fetch(
        `${this.orderServiceUrl}/orders/restaurant/${restaurantId}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch restaurant orders', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.getRestaurantOrders(restaurantId);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single order details' })
  async getOrder(@Param('id') id: string) {
    try {
      const response = await fetch(`${this.orderServiceUrl}/orders/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Order not found', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.getOrder(id);
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status lifecycle' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; changedBy?: string; actorId?: string },
  ) {
    try {
      const response = await fetch(`${this.orderServiceUrl}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Status update failed', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.updateOrderStatus(id, body.status);
    }
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept incoming order' })
  async acceptOrder(@Param('id') id: string) {
    try {
      const response = await fetch(`${this.orderServiceUrl}/orders/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Accept order failed', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return this.inProcessOrders.updateOrderStatus(id, 'PREPARING' as any);
    }
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get order status change logs timeline' })
  async getOrderLogs(@Param('id') id: string) {
    try {
      const response = await fetch(`${this.orderServiceUrl}/orders/${id}/logs`);
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch logs', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException && error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      return [];
    }
  }
}
