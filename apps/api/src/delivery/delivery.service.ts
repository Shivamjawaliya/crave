import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus, OrderStatus } from '@food-platform/shared-types';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableJobs() {
    return this.prisma.delivery.findMany({
      where: {
        status: DeliveryStatus.UNASSIGNED,
        order: {
          status: {
            in: [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
          },
        },
      },
      include: {
        order: {
          include: {
            restaurant: { select: { id: true, name: true, address: true } },
            customer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveDelivery(partnerUserId: string) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      throw new NotFoundException('Delivery profile not found');
    }

    return this.prisma.delivery.findFirst({
      where: {
        partnerId: profile.id,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.ACCEPTED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
          ],
        },
      },
      include: {
        order: {
          include: {
            restaurant: true,
            customer: { select: { id: true, name: true } },
            items: true,
          },
        },
      },
    });
  }

  async getDeliveryHistory(partnerUserId: string) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      throw new NotFoundException('Delivery profile not found');
    }

    return this.prisma.delivery.findMany({
      where: {
        partnerId: profile.id,
        status: DeliveryStatus.DELIVERED,
      },
      include: {
        order: {
          include: {
            restaurant: { select: { id: true, name: true } },
            items: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async acceptJob(deliveryId: string, partnerUserId: string) {
    let profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      profile = await this.prisma.deliveryProfile.create({
        data: {
          userId: partnerUserId,
          vehicleType: 'Motorcycle',
          isAvailable: true,
        },
      });
    }

    // Atomic assignment check to prevent race condition
    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery job not found');
      }

      if (delivery.status !== DeliveryStatus.UNASSIGNED) {
        throw new ConflictException(
          'This delivery assignment has already been accepted by another partner',
        );
      }

      const updated = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          partnerId: profile.id,
          status: DeliveryStatus.ACCEPTED,
          assignedAt: new Date(),
        },
        include: {
          order: {
            include: {
              restaurant: true,
              items: true,
            },
          },
        },
      });

      return updated;
    });
  }

  async updateDeliveryStatus(
    deliveryId: string,
    partnerUserId: string,
    status: DeliveryStatus,
  ) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      throw new NotFoundException('Delivery profile not found');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery record not found');
    }

    if (delivery.partnerId !== profile.id) {
      throw new ForbiddenException('Not assigned to this delivery');
    }

    const data: any = { status };
    if (status === DeliveryStatus.PICKED_UP) {
      data.pickedUpAt = new Date();
      // Also update order status
      await this.prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.PICKED_UP },
      });
    } else if (status === DeliveryStatus.IN_TRANSIT) {
      await this.prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.OUT_FOR_DELIVERY },
      });
    } else if (status === DeliveryStatus.DELIVERED) {
      data.deliveredAt = new Date();
      await this.prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.DELIVERED },
      });
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data,
      include: { order: true },
    });
  }
}
