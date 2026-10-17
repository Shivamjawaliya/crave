import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Delivery (API Gateway)')
@Controller('delivery')
export class GatewayDeliveryController {
  private deliveryServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.deliveryServiceUrl =
      this.configService.get<string>('DELIVERY_SERVICE_URL') ||
      'http://localhost:4005';
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List unassigned delivery jobs ready for dispatch' })
  async getJobs() {
    try {
      const response = await fetch(`${this.deliveryServiceUrl}/delivery/jobs`);
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch jobs', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('active/:partnerUserId')
  @ApiOperation({ summary: 'Get current active delivery trip for driver' })
  async getActiveTrip(@Param('partnerUserId') partnerUserId: string) {
    try {
      const response = await fetch(
        `${this.deliveryServiceUrl}/delivery/active/${partnerUserId}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch active trip', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Accept delivery assignment' })
  async acceptJob(@Param('id') id: string, @Body() body: { partnerUserId: string }) {
    try {
      const response = await fetch(`${this.deliveryServiceUrl}/delivery/jobs/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to accept job', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch('jobs/:id/status')
  @ApiOperation({ summary: 'Update trip status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; verificationCode?: string; reason?: string },
  ) {
    try {
      const response = await fetch(`${this.deliveryServiceUrl}/delivery/jobs/${id}/status`, {
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
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('jobs/:id/location')
  @ApiOperation({ summary: 'Record partner GPS location' })
  async recordLocation(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    try {
      const response = await fetch(`${this.deliveryServiceUrl}/delivery/jobs/${id}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Location recording failed', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('profile/:partnerUserId')
  @ApiOperation({ summary: 'Get driver profile, duty status & earnings stats' })
  async getProfile(@Param('partnerUserId') partnerUserId: string) {
    try {
      const response = await fetch(
        `${this.deliveryServiceUrl}/delivery/profile/${partnerUserId}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch driver profile', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch('profile/:partnerUserId/availability')
  @ApiOperation({ summary: 'Toggle online / offline availability duty switch' })
  async toggleAvailability(
    @Param('partnerUserId') partnerUserId: string,
    @Body() body: { isAvailable: boolean },
  ) {
    try {
      const response = await fetch(
        `${this.deliveryServiceUrl}/delivery/profile/${partnerUserId}/availability`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to toggle duty', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch('profile/:partnerUserId')
  @ApiOperation({ summary: 'Update driver vehicle profile or details' })
  async updateProfile(
    @Param('partnerUserId') partnerUserId: string,
    @Body()
    body: {
      vehicleType?: string;
      vehicleNumber?: string;
      emergencyContact?: string;
      name?: string;
    },
  ) {
    try {
      const response = await fetch(
        `${this.deliveryServiceUrl}/delivery/profile/${partnerUserId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to update profile', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('jobs/:id/report-issue')
  @ApiOperation({ summary: 'Report exception or cancellation issue on a trip' })
  async reportIssue(
    @Param('id') id: string,
    @Body() body: { partnerUserId: string; reason: string; notes?: string },
  ) {
    try {
      const response = await fetch(
        `${this.deliveryServiceUrl}/delivery/jobs/${id}/report-issue`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to report issue', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Delivery service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
