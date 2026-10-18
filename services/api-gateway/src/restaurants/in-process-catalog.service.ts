import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InProcessCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurants(search?: string) {
    const where: any = {
      status: 'APPROVED',
    };

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.restaurant.findMany({
      where,
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async addCategory(restaurantId: string, body: any) {
    return this.prisma.menuCategory.create({
      data: {
        restaurantId,
        name: body.name,
        sortOrder: body.sortOrder || 0,
      },
    });
  }

  async addItem(categoryId: string, body: any) {
    const pricePaise = body.pricePaise !== undefined
      ? Number(body.pricePaise)
      : Math.round((Number(body.price) || 0) * 100);

    return this.prisma.menuItem.create({
      data: {
        categoryId,
        name: body.name,
        description: body.description || '',
        pricePaise,
        imageUrl: body.imageUrl,
        isAvailable: body.isAvailable ?? true,
      },
    });
  }

  async toggleAvailability(itemId: string, body: any) {
    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        isAvailable: Boolean(body.isAvailable),
      },
    });
  }

  async updateItem(itemId: string, body: any) {
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.pricePaise !== undefined) {
      updateData.pricePaise = Number(body.pricePaise);
    } else if (body.price !== undefined) {
      updateData.pricePaise = Math.round(Number(body.price) * 100);
    }
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
    });
  }
}
