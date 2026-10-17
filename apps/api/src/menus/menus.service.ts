import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async addCategory(
    restaurantId: string,
    ownerId: string,
    data: { name: string; sortOrder?: number },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized for this restaurant');
    }

    return this.prisma.menuCategory.create({
      data: {
        restaurantId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async addItem(
    categoryId: string,
    ownerId: string,
    data: {
      name: string;
      description?: string;
      pricePaise: number;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { restaurant: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized for this restaurant');
    }

    return this.prisma.menuItem.create({
      data: {
        categoryId,
        name: data.name,
        description: data.description,
        pricePaise: data.pricePaise,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable ?? true,
      },
    });
  }

  async updateItem(
    itemId: string,
    ownerId: string,
    data: {
      name?: string;
      description?: string;
      pricePaise?: number;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: { include: { restaurant: true } } },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.category.restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to edit this item');
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data,
    });
  }

  async toggleAvailability(itemId: string, ownerId: string, isAvailable: boolean) {
    return this.updateItem(itemId, ownerId, { isAvailable });
  }
}
