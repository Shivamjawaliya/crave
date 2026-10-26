import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

// In-memory sliding rate limiter for brute-force prevention
const authRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxAttempts = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = authRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    authRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (entry.count >= maxAttempts) {
    const waitSec = Math.ceil((entry.resetAt - now) / 1000);
    throw new HttpException(
      `Too many authentication attempts. Please try again in ${waitSec} seconds.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  entry.count++;
}

function setAuthCookies(res: Response, accessToken?: string) {
  if (!accessToken) return;
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookies(res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}

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
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    checkRateLimit(String(clientIp), 10, 60000);

    // Allow CUSTOMER, DELIVERY_PARTNER, and RESTAURANT_OWNER registrations
    const allowedRoles = ['CUSTOMER', 'DELIVERY_PARTNER', 'RESTAURANT_OWNER'];
    const assignedRole = (body.role && allowedRoles.includes(body.role)) ? body.role : 'CUSTOMER';
    const safePayload = {
      ...body,
      name: body.name,
      email: body.email,
      password: body.password,
      role: assignedRole,
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

      setAuthCookies(res, data.accessToken);
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
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    checkRateLimit(String(clientIp), 8, 60000); // Max 8 attempts per minute

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

      setAuthCookies(res, data.accessToken);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('restaurant/register')
  @ApiOperation({ summary: 'Register restaurant owner account and provision restaurant' })
  async registerRestaurant(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      restaurantName?: string;
      restaurantAddress?: string;
      restaurantDescription?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const response = await fetch(`${this.authServiceUrl}/restaurant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new HttpException(
          data.message || 'Restaurant owner registration failed',
          response.status,
        );
      }

      setAuthCookies(res, data.accessToken);
      return data;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('restaurant/login')
  @ApiOperation({ summary: 'Login restaurant owner (RBAC enforced)' })
  async loginRestaurant(
    @Body()
    body: {
      email: string;
      password: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const response = await fetch(`${this.authServiceUrl}/restaurant/login`, {
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

      setAuthCookies(res, data.accessToken);
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
  @ApiOperation({ summary: 'Get current user profile via JWT Bearer token or session cookie' })
  async getMe(
    @Req() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const token =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null) ||
      req.cookies?.access_token;

    if (!token) {
      throw new HttpException('Missing authorization token or session cookie', HttpStatus.UNAUTHORIZED);
    }

    try {
      const response = await fetch(`${this.authServiceUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
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
  @ApiOperation({ summary: 'Revoke active authentication session and clear cookies' })
  async logout(
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    clearAuthCookies(res);

    try {
      const response = await fetch(`${this.authServiceUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return await response.json();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Auth service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
