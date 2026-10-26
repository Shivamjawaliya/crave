import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard, AuthenticatedRequest } from '../auth/jwt-auth.guard';

@ApiTags('Users & Addresses (API Gateway)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class GatewayUsersController {
  private authServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:4001';
  }

  private verifyOwnership(req: AuthenticatedRequest, targetUserId: string) {
    if (req.user?.userId !== targetUserId && req.user?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view or modify this user account.',
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    this.verifyOwnership(req, id);
    try {
      const response = await fetch(`${this.authServiceUrl}/users/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'User not found', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { name?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    this.verifyOwnership(req, id);
    try {
      const response = await fetch(`${this.authServiceUrl}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Update failed', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Get all saved addresses for a user' })
  async getAddresses(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    this.verifyOwnership(req, id);
    try {
      const response = await fetch(`${this.authServiceUrl}/users/${id}/addresses`);
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to fetch addresses', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Save a new address into PostgreSQL for user' })
  async addAddress(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      houseNumber?: string;
      landmark?: string;
      contactName?: string;
      contactPhone?: string;
      addressLine: string;
      city?: string;
      state?: string;
      pincode?: string;
      isDefault?: boolean;
      latitude?: number;
      longitude?: number;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    this.verifyOwnership(req, id);
    try {
      const response = await fetch(`${this.authServiceUrl}/users/${id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to add address', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Put(':id/addresses/:addressId/default')
  @ApiOperation({ summary: 'Set an address as default' })
  async setDefaultAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.verifyOwnership(req, id);
    try {
      const response = await fetch(
        `${this.authServiceUrl}/users/${id}/addresses/${addressId}/default`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to set default address', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Delete a saved address' })
  async deleteAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.verifyOwnership(req, id);
    try {
      const response = await fetch(
        `${this.authServiceUrl}/users/${id}/addresses/${addressId}`,
        {
          method: 'DELETE',
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Failed to delete address', response.status);
      }
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
