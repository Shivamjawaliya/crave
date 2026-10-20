import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantStatus } from '@food-platform/shared-types';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, isAcceptingOrders?: boolean) {
    const where: any = { status: RestaurantStatus.APPROVED };
    if (isAcceptingOrders !== undefined) {
      where.isAcceptingOrders = isAcceptingOrders;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.restaurant.findMany({
      where,
      include: {
        categories: {
          include: { items: { where: { isAvailable: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: { items: true },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async createRestaurant(data: {
    ownerId: string;
    name: string;
    description?: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.prisma.restaurant.create({
      data: {
        ...data,
        status: RestaurantStatus.PENDING,
      },
    });
  }

  async addCategory(restaurantId: string, name: string, sortOrder: number = 0) {
    return this.prisma.menuCategory.create({
      data: { restaurantId, name, sortOrder },
    });
  }

  async addItem(categoryId: string, data: { name: string; description?: string; pricePaise: number; imageUrl?: string }) {
    return this.prisma.menuItem.create({
      data: { categoryId, ...data, isAvailable: true },
    });
  }

  async toggleItemAvailability(itemId: string, isAvailable: boolean) {
    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
    });
  }

  async updateItem(itemId: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.pricePaise !== undefined) updateData.pricePaise = data.pricePaise;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
    });
  }

  async updateAcceptingOrders(id: string, isAcceptingOrders: boolean) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return this.prisma.restaurant.update({
      where: { id },
      data: { isAcceptingOrders },
      include: {
        categories: {
          include: { items: true },
        },
      },
    });
  }

  async updateStatus(id: string, data: { status?: any; isAcceptingOrders?: boolean }) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isAcceptingOrders !== undefined) updateData.isAcceptingOrders = data.isAcceptingOrders;
    return this.prisma.restaurant.update({
      where: { id },
      data: updateData,
    });
  }
}
