import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus, UserRole } from '@food-platform/shared-types';

@ApiTags('Owner Orders')
@Controller('owner/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
@ApiBearerAuth()
export class OwnerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get incoming and active restaurant orders' })
  async findOwnerOrders(
    @CurrentUser('id') ownerId: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findOwnerOrders(ownerId, status);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order lifecycle (ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP)',
  })
  async updateStatus(
    @Param('id') orderId: string,
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() body: { status: OrderStatus; note?: string },
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      body.status,
      ownerId,
      role,
      body.note,
    );
  }
}
