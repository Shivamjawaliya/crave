import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserRole } from '@food-platform/shared-types';

@ApiTags('Auth Service Endpoints')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new customer account (Enforces RBAC CUSTOMER)' })
  register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('auth/register')
  @ApiOperation({ summary: 'Register new customer account (prefixed route)' })
  registerPrefixed(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and issue JWT tokens' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login user and issue JWT tokens (prefixed route)' })
  loginPrefixed(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Get('auth/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile via JWT Bearer token' })
  getMe(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.verifyAccessToken(token);
  }

  @Post('auth/refresh')
  @ApiOperation({ summary: 'Rotate refresh token' })
  refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshSession(body.refreshToken);
  }

  @Post('auth/logout')
  @ApiOperation({ summary: 'Revoke active refresh session' })
  logout(@Body() body: { refreshToken?: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  getProfile(@Param('id') id: string) {
    return this.authService.getProfile(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Param('id') id: string, @Body() body: { name?: string }) {
    return this.authService.updateProfile(id, body);
  }

  @Get('users/:id/addresses')
  @ApiOperation({ summary: 'Get all saved addresses for a user' })
  getAddresses(@Param('id') id: string) {
    return this.authService.getAddresses(id);
  }

  @Post('users/:id/addresses')
  @ApiOperation({ summary: 'Add a new address for a user' })
  addAddress(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      addressLine: string;
      city?: string;
      state?: string;
      pincode?: string;
      isDefault?: boolean;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.authService.addAddress(id, body);
  }

  @Put('users/:id/addresses/:addressId/default')
  @ApiOperation({ summary: 'Set an address as default' })
  setDefaultAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.authService.setDefaultAddress(id, addressId);
  }

  @Delete('users/:id/addresses/:addressId')
  @ApiOperation({ summary: 'Delete a saved address' })
  deleteAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.authService.deleteAddress(id, addressId);
  }
}
