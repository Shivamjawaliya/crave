import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InProcessAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
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
    const validRoles = ['CUSTOMER', 'DELIVERY_PARTNER', 'RESTAURANT_OWNER'];
    const assignedRole = (data.role && validRoles.includes(data.role))
      ? (data.role as any)
      : 'CUSTOMER';

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

    if (assignedRole === 'DELIVERY_PARTNER') {
      await this.prisma.deliveryProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          vehicleType: (data as any).vehicleType || 'Motorcycle',
          isAvailable: true,
        },
      });
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

  async registerRestaurantOwner(data: {
    name: string;
    email: string;
    password: string;
    restaurantName?: string;
    restaurantAddress?: string;
    restaurantDescription?: string;
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

    const user = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        role: 'RESTAURANT_OWNER' as any,
        isActive: true,
      },
    });

    const restaurant = await this.prisma.restaurant.create({
      data: {
        ownerId: user.id,
        name: data.restaurantName?.trim() || `${user.name}'s Kitchen`,
        address: data.restaurantAddress?.trim() || 'Culinary Street, Downtown',
        description:
          data.restaurantDescription?.trim() ||
          'Artisan handcrafted culinary creations.',
        status: 'APPROVED',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          description: restaurant.description,
        },
      },
      ...tokens,
    };
  }

  async login(data: { email: string; password: string; requiredRole?: string }) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        restaurants: {
          select: { id: true, name: true, address: true, description: true },
        },
        deliveryProfile: true,
      },
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

    if (data.requiredRole && user.role !== data.requiredRole && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        `Access restricted: This portal is exclusively for ${data.requiredRole}s. Your account role is ${user.role}.`,
      );
    }

    const restaurant = user.restaurants?.[0] || null;
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant,
        deliveryProfile: user.deliveryProfile,
      },
      ...tokens,
    };
  }

  async getMe(authHeader: string) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const secret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'food_platform_jwt_access_secret_key_change_in_prod_123456789',
    );

    try {
      const decoded = jwt.verify(token, secret) as any;
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          restaurants: { select: { id: true, name: true } },
          deliveryProfile: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account invalid or deactivated');
      }

      return user;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
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

    const accessToken = jwt.sign(
      { sub: userId, email, role },
      secret,
      { expiresIn: '15m' },
    );
    const refreshToken = jwt.sign(
      { sub: userId, email },
      refreshSecret,
      { expiresIn: '7d' },
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
