import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Orders (API Gateway)')
@Controller('orders')
export class GatewayOrdersController {
  private orderServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
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
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Order service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
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
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Order service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
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
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Order service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
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
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Order service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status lifecycle' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; actorId?: string },
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
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Order service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
