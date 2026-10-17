import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantStatus } from '@food-platform/shared-types';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { search?: string; status?: RestaurantStatus }) {
    const where: any = {
      status: query?.status || RestaurantStatus.APPROVED,
    };

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.restaurant.findMany({
      where,
      include: {
        categories: {
          include: {
            items: {
              where: { isAvailable: true },
            },
          },
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
          include: {
            items: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async findOwnerRestaurants(ownerId: string) {
    return this.prisma.restaurant.findMany({
      where: { ownerId },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRestaurant(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      address: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.prisma.restaurant.create({
      data: {
        ownerId,
        ...data,
        status: RestaurantStatus.PENDING,
      },
    });
  }

  async updateRestaurant(
    restaurantId: string,
    ownerId: string,
    data: {
      name?: string;
      description?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this restaurant');
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });
  }
}
