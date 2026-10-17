import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus, OrderStatus } from '@food-platform/shared-types';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableJobs() {
    return this.prisma.delivery.findMany({
      where: { status: DeliveryStatus.UNASSIGNED },
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

  async acceptJob(deliveryId: string, partnerUserId: string) {
    let profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      profile = await this.prisma.deliveryProfile.create({
        data: { userId: partnerUserId, vehicleType: 'Motorcycle', isAvailable: true },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({ where: { id: deliveryId } });
      if (!delivery) throw new NotFoundException('Job not found');
      if (delivery.status !== DeliveryStatus.UNASSIGNED) {
        throw new ConflictException('Job already accepted by another partner');
      }

      return tx.delivery.update({
        where: { id: deliveryId },
        data: { partnerId: profile.id, status: DeliveryStatus.ACCEPTED, assignedAt: new Date() },
        include: { order: { include: { restaurant: true } } },
      });
    });
  }

  async updateStatus(deliveryId: string, status: DeliveryStatus) {
    const data: any = { status };
    if (status === DeliveryStatus.PICKED_UP) data.pickedUpAt = new Date();
    if (status === DeliveryStatus.DELIVERED) data.deliveredAt = new Date();

    const delivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data,
    });

    const orderStatusMap: Partial<Record<DeliveryStatus, OrderStatus>> = {
      [DeliveryStatus.PICKED_UP]: OrderStatus.PICKED_UP,
      [DeliveryStatus.IN_TRANSIT]: OrderStatus.OUT_FOR_DELIVERY,
      [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
    };

    if (orderStatusMap[status]) {
      await this.prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatusMap[status] },
      });
    }

    return delivery;
  }

  async recordLocation(deliveryId: string, coords: { latitude: number; longitude: number }) {
    return this.prisma.deliveryLocation.create({
      data: { deliveryId, latitude: coords.latitude, longitude: coords.longitude },
    });
  }
}
