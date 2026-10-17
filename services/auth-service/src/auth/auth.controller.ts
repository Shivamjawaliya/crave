import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserRole } from '@food-platform/shared-types';

@ApiTags('Auth Service Endpoints')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user account' })
  register(@Body() body: { name: string; email: string; password: string; role?: UserRole }) {
    return this.authService.register(body);
  }

  @Post('auth/register')
  @ApiOperation({ summary: 'Register new user account (prefixed route)' })
  registerPrefixed(@Body() body: { name: string; email: string; password: string; role?: UserRole }) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and issue tokens' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login user and issue tokens (prefixed route)' })
  loginPrefixed(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  getProfile(@Param('id') id: string) {
    return this.authService.getProfile(id);
  }
}
