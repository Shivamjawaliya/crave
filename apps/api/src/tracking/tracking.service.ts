import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { DeliveryStatus, UserRole } from '@food-platform/shared-types';

@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async submitLocation(
    partnerUserId: string,
    coords: { latitude: number; longitude: number },
  ) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      throw new NotFoundException('Delivery profile not found');
    }

    // Find actively assigned delivery
    const activeDelivery = await this.prisma.delivery.findFirst({
      where: {
        partnerId: profile.id,
        status: {
          in: [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
        },
      },
    });

    if (!activeDelivery) {
      return { status: 'no_active_delivery' };
    }

    // Record location in database
    await this.prisma.deliveryLocation.create({
      data: {
        deliveryId: activeDelivery.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    // Real-time broadcast to subscribed customers
    this.realtimeGateway.broadcastDeliveryLocation(
      activeDelivery.orderId,
      coords,
    );

    return {
      status: 'success',
      deliveryId: activeDelivery.id,
      coordinates: coords,
    };
  }

  async getOrderTracking(orderId: string, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        delivery: {
          include: {
            partner: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            locations: {
              take: 1,
              orderBy: { recordedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.CUSTOMER && order.customerId !== userId) {
      throw new ForbiddenException('Access denied to this order tracking');
    }

    const latestLocation = order.delivery?.locations?.[0] || null;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      deliveryStatus: order.delivery?.status || 'UNASSIGNED',
      restaurant: order.restaurant,
      destinationAddress: order.addressSnapshot,
      deliveryPartner: order.delivery?.partner
        ? {
            name: order.delivery.partner.user.name,
            vehicleType: order.delivery.partner.vehicleType,
          }
        : null,
      currentLocation: latestLocation
        ? {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            recordedAt: latestLocation.recordedAt,
          }
        : null,
    };
  }
}
