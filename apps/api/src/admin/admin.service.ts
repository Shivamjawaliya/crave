import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantStatus } from '@food-platform/shared-types';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalRestaurants,
      pendingRestaurants,
      totalOrders,
      revenueResult,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({
        where: { status: RestaurantStatus.PENDING },
      }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        _sum: { amountPaise: true },
        where: { status: 'PAID' },
      }),
    ]);

    return {
      totalUsers,
      totalRestaurants,
      pendingRestaurants,
      totalOrders,
      totalRevenuePaise: revenueResult._sum.amountPaise || 0,
    };
  }

  async getUsers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
    adminId: string,
    reason?: string,
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        targetType: 'User',
        targetId: userId,
        metadata: { reason },
      },
    });

    return user;
  }

  async getRestaurants(status?: RestaurantStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.restaurant.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRestaurantStatus(
    restaurantId: string,
    status: RestaurantStatus,
    adminId: string,
    notes?: string,
  ) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: `RESTAURANT_STATUS_${status}`,
        targetType: 'Restaurant',
        targetId: restaurantId,
        metadata: { status, notes },
      },
    });

    return restaurant;
  }

  async getOrders() {
    return this.prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        payment: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getDeliveries() {
    return this.prisma.delivery.findMany({
      include: {
        order: {
          include: {
            restaurant: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
          },
        },
        partner: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditLogs() {
    return this.prisma.adminAuditLog.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
