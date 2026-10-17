import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@food-platform/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new account.
   * RBAC Enforcement: Any user registered from the customer portal is strictly
   * assigned the CUSTOMER role. Privilege escalation to ADMIN/OWNER/PARTNER is strictly prevented.
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole | string;
  }) {
    const email = data.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered. Please sign in instead.');
    }

    if (!data.password || data.password.length < 8) {
      throw new UnauthorizedException('Password must be at least 8 characters long.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // RBAC: Enforce CUSTOMER role for portal registrations
    const assignedRole = UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        role: assignedRole,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Authenticate user with email and password.
   * Returns JWT accessToken and refreshToken.
   */
  async login(data: { email: string; password: string }) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Verify an active JWT access token.
   */
  async verifyAccessToken(token: string) {
    try {
      const secret = this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'food_platform_jwt_access_secret_key_change_in_prod_123456789',
      );
      const payload = this.jwtService.verify(token, { secret });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is invalid or deactivated');
      }
      return user;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  /**
   * Rotate refresh token and issue new session.
   */
  async refreshSession(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'food_platform_jwt_refresh_secret_key_change_in_prod_987654321',
      );
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await this.prisma.refreshSession.findFirst({
        where: {
          tokenHash,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Refresh token revoked or expired');
      }

      // Revoke old session
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User inactive');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Failed to refresh authentication session');
    }
  }

  /**
   * Invalidate refresh token session on logout.
   */
  async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        addresses: true,
        deliveryProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const secret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'food_platform_jwt_access_secret_key_change_in_prod_123456789',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'food_platform_jwt_refresh_secret_key_change_in_prod_987654321',
    );

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { secret, expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      { secret: refreshSecret, expiresIn: '7d' },
    );

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshSession
      .create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      })
      .catch(() => null);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
