import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest {
  user?: AuthUser;
  headers: Record<string, string | string[] | undefined>;
  [key: string]: any;
}

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.secret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'food_platform_jwt_access_secret_key_change_in_prod_123456789';
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    // 1. Try httpOnly cookie first
    let token: string | null = null;
    if (req.cookies && typeof req.cookies['access_token'] === 'string') {
      token = req.cookies['access_token'];
    }

    // 2. Fall back to Authorization Bearer header
    if (!token) {
      const authHeader = req.headers['authorization'];
      const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      if (headerValue && headerValue.startsWith('Bearer ')) {
        token = headerValue.slice(7).trim();
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication required: Missing access token or session cookie');
    }

    const verifiedUser = this.verifyToken(token);
    if (!verifiedUser) {
      throw new UnauthorizedException('Invalid or expired authentication session');
    }

    req.user = verifiedUser;
    return true;
  }

  verifyToken(token: string): AuthUser | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;
      const data = `${headerB64}.${payloadB64}`;

      const computedSig = crypto
        .createHmac('sha256', this.secret)
        .update(data)
        .digest('base64url');

      if (computedSig !== signatureB64) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      );

      // Expiration check (exp is in seconds)
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return null;
      }

      return {
        userId: payload.sub || payload.userId || payload.id,
        email: payload.email || '',
        role: payload.role || 'CUSTOMER',
      };
    } catch {
      return null;
    }
  }
}
