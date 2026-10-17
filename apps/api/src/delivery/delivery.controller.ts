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
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, DeliveryStatus } from '@food-platform/shared-types';

@ApiTags('Delivery Partner')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PARTNER, UserRole.ADMIN)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List available delivery jobs' })
  async getJobs() {
    return this.deliveryService.getAvailableJobs();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active delivery for partner' })
  async getActive(@CurrentUser('id') partnerUserId: string) {
    return this.deliveryService.getActiveDelivery(partnerUserId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed delivery history' })
  async getHistory(@CurrentUser('id') partnerUserId: string) {
    return this.deliveryService.getDeliveryHistory(partnerUserId);
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Accept delivery assignment with concurrency check' })
  async acceptJob(
    @Param('id') deliveryId: string,
    @CurrentUser('id') partnerUserId: string,
  ) {
    return this.deliveryService.acceptJob(deliveryId, partnerUserId);
  }

  @Patch('jobs/:id/status')
  @ApiOperation({
    summary: 'Update delivery status (PICKED_UP, IN_TRANSIT, DELIVERED)',
  })
  async updateStatus(
    @Param('id') deliveryId: string,
    @CurrentUser('id') partnerUserId: string,
    @Body() body: { status: DeliveryStatus },
  ) {
    return this.deliveryService.updateDeliveryStatus(
      deliveryId,
      partnerUserId,
      body.status,
    );
  }
}
