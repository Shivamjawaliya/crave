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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, RestaurantStatus } from '@food-platform/shared-types';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform KPI overview' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  @ApiOperation({ summary: 'Search and inspect users' })
  async getUsers(@Query('search') search?: string) {
    return this.adminService.getUsers(search);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async updateUserStatus(
    @Param('id') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { isActive: boolean; reason?: string },
  ) {
    return this.adminService.updateUserStatus(
      userId,
      body.isActive,
      adminId,
      body.reason,
    );
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'List restaurants and review approval status' })
  async getRestaurants(@Query('status') status?: RestaurantStatus) {
    return this.adminService.getRestaurants(status);
  }

  @Patch('restaurants/:id/status')
  @ApiOperation({ summary: 'Approve, suspend or reject a restaurant' })
  async updateRestaurantStatus(
    @Param('id') restaurantId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { status: RestaurantStatus; notes?: string },
  ) {
    return this.adminService.updateRestaurantStatus(
      restaurantId,
      body.status,
      adminId,
      body.notes,
    );
  }

  @Get('orders')
  @ApiOperation({ summary: 'Global order investigation' })
  async getOrders() {
    return this.adminService.getOrders();
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Global delivery oversight' })
  async getDeliveries() {
    return this.adminService.getDeliveries();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Review admin action audit logs' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
