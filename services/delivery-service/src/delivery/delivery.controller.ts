import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { DeliveryStatus } from '@food-platform/shared-types';

@ApiTags('Delivery Microservice')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List unassigned delivery jobs' })
  getJobs() {
    return this.deliveryService.getAvailableJobs();
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Accept delivery assignment' })
  acceptJob(@Param('id') id: string, @Body() body: { partnerUserId: string }) {
    return this.deliveryService.acceptJob(id, body.partnerUserId);
  }

  @Patch('jobs/:id/status')
  @ApiOperation({ summary: 'Update trip status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: DeliveryStatus }) {
    return this.deliveryService.updateStatus(id, body.status);
  }

  @Post('jobs/:id/location')
  @ApiOperation({ summary: 'Record partner GPS location' })
  recordLocation(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    return this.deliveryService.recordLocation(id, body);
  }
}
