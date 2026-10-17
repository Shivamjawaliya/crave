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

  async register(data: { name: string; email: string; password: string; role?: UserRole }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = data.role || UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: role as any,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new UnauthorizedException('Account deactivated');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
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
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET', 'food_platform_jwt_access_secret_key_change_in_prod_123456789');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'food_platform_jwt_refresh_secret_key_change_in_prod_987654321');

    const accessToken = this.jwtService.sign({ sub: userId, email, role }, { secret, expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ sub: userId, email }, { secret: refreshSecret, expiresIn: '7d' });

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
