import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth (API Gateway)')
@Controller('auth')
export class GatewayAuthController {
  private authServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:4001';
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account (RBAC: Forced to CUSTOMER)' })
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role?: string;
    },
  ) {
    // RBAC Security Enforcement:
    // Any registration via the public gateway / user portal is strictly restricted
    // to role 'CUSTOMER'. Any requested role from the client is safely overridden.
    const safePayload = {
      name: body.name,
      email: body.email,
      password: body.password,
      role: 'CUSTOMER',
    };

    try {
      const response = await fetch(`${this.authServiceUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safePayload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(
          data.message || 'Registration failed',
          response.status,
        );
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

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    try {
      const response = await fetch(`${this.authServiceUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(
          data.message || 'Invalid email or password',
          response.status,
        );
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

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile via JWT Bearer token' })
  async getMe(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      throw new HttpException('Missing authorization header', HttpStatus.UNAUTHORIZED);
    }

    try {
      const response = await fetch(`${this.authServiceUrl}/auth/me`, {
        headers: { Authorization: authHeader },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(data.message || 'Unauthorized', response.status);
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

  @Post('logout')
  @ApiOperation({ summary: 'Revoke active authentication session' })
  async logout(@Body() body: { refreshToken?: string }) {
    try {
      const response = await fetch(`${this.authServiceUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return await response.json();
    } catch {
      return { success: true, message: 'Logged out' };
    }
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Param('id') id: string) {
    try {
      const response = await fetch(`${this.authServiceUrl}/users/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(
          data.message || 'User not found',
          response.status,
        );
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
