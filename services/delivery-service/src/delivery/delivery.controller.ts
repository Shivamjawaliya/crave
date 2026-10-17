import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { DeliveryStatus } from '@prisma/client';

@ApiTags('Delivery Microservice')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List unassigned delivery jobs ready for dispatch' })
  getJobs() {
    return this.deliveryService.getAvailableJobs();
  }

  @Get('active/:partnerUserId')
  @ApiOperation({ summary: 'Get current active delivery trip for driver' })
  getActiveTrip(@Param('partnerUserId') partnerUserId: string) {
    return this.deliveryService.getActiveTrip(partnerUserId);
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Accept delivery assignment' })
  acceptJob(@Param('id') id: string, @Body() body: { partnerUserId: string }) {
    return this.deliveryService.acceptJob(id, body.partnerUserId);
  }

  @Patch('jobs/:id/status')
  @ApiOperation({ summary: 'Update trip status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: DeliveryStatus | string; verificationCode?: string; reason?: string },
  ) {
    return this.deliveryService.updateStatus(id, body.status, {
      verificationCode: body.verificationCode,
      reason: body.reason,
    });
  }

  @Post('jobs/:id/location')
  @ApiOperation({ summary: 'Record partner GPS location' })
  recordLocation(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    return this.deliveryService.recordLocation(id, body);
  }

  @Get('profile/:partnerUserId')
  @ApiOperation({ summary: 'Get driver profile, duty status & earnings stats' })
  getProfile(@Param('partnerUserId') partnerUserId: string) {
    return this.deliveryService.getDriverProfile(partnerUserId);
  }

  @Patch('profile/:partnerUserId/availability')
  @ApiOperation({ summary: 'Toggle online / offline availability duty switch' })
  toggleAvailability(
    @Param('partnerUserId') partnerUserId: string,
    @Body() body: { isAvailable: boolean },
  ) {
    return this.deliveryService.toggleAvailability(partnerUserId, body.isAvailable);
  }

  @Patch('profile/:partnerUserId')
  @ApiOperation({ summary: 'Update driver vehicle profile or details' })
  updateProfile(
    @Param('partnerUserId') partnerUserId: string,
    @Body()
    body: {
      vehicleType?: string;
      vehicleNumber?: string;
      emergencyContact?: string;
      name?: string;
    },
  ) {
    return this.deliveryService.updateDriverProfile(partnerUserId, body);
  }

  @Post('jobs/:id/report-issue')
  @ApiOperation({ summary: 'Report exception or cancellation issue on a trip' })
  reportIssue(
    @Param('id') id: string,
    @Body() body: { partnerUserId: string; reason: string; notes?: string },
  ) {
    return this.deliveryService.reportIssue(id, body.partnerUserId, body.reason, body.notes);
  }
}
