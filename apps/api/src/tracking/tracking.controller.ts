import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@food-platform/shared-types';

@ApiTags('Tracking')
@Controller()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('delivery/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit real-time GPS coordinates for active delivery' })
  async submitLocation(
    @CurrentUser('id') partnerUserId: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.trackingService.submitLocation(partnerUserId, body);
  }

  @Get('orders/:id/tracking')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current order status and live location' })
  async getOrderTracking(
    @Param('id') orderId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.trackingService.getOrderTracking(orderId, userId, role);
  }
}
