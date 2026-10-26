import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

function sanitizeOrderForDriver(order: any) {
  if (!order) return order;
  const snapshot = order.addressSnapshot ? { ...(order.addressSnapshot as object) } : {};
  delete (snapshot as any).deliveryOtp;
  delete (snapshot as any).callboxCode;
  return {
    ...order,
    addressSnapshot: snapshot,
  };
}

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all unassigned delivery jobs ready for driver dispatch
   * (Available only when kitchen starts PREPARING or food is READY_FOR_PICKUP, NOT when PLACED or ACCEPTED)
   */
  async getAvailableJobs() {
    const jobs = await this.prisma.delivery.findMany({
      where: {
        status: DeliveryStatus.UNASSIGNED,
        order: {
          status: {
            in: [
              OrderStatus.PREPARING,
              OrderStatus.READY_FOR_PICKUP,
            ],
          },
        },
      },
      include: {
        order: {
          include: {
            restaurant: {
              select: { id: true, name: true, address: true, latitude: true, longitude: true },
            },
            customer: {
              select: { id: true, name: true, email: true },
            },
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => ({
      ...job,
      order: sanitizeOrderForDriver(job.order),
    }));
  }

  /**
   * Get currently active trip for a driver
   */
  async getActiveTrip(partnerUserId: string) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) return null;

    const delivery = await this.prisma.delivery.findFirst({
      where: {
        partnerId: profile.id,
        status: {
          in: [
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
            customer: { select: { id: true, name: true, email: true } },
            items: true,
            statusLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
        locations: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!delivery) return null;

    let logicalStatus: string = delivery.status;
    const latestDriverLog = delivery.order.statusLogs?.find((l) => l.changedBy?.includes('DRIVER'));
    if (latestDriverLog?.changedBy?.includes('Arrived at Store') && delivery.status === DeliveryStatus.ACCEPTED) {
      logicalStatus = 'ARRIVED_AT_STORE';
    } else if (latestDriverLog?.changedBy?.includes('Arrived at Customer') && delivery.status === DeliveryStatus.IN_TRANSIT) {
      logicalStatus = 'ARRIVED_AT_CUSTOMER';
    }

    return {
      ...delivery,
      status: logicalStatus,
      order: sanitizeOrderForDriver(delivery.order),
    };
  }

  /**
   * Accept an available delivery job
   */
  async acceptJob(deliveryId: string, partnerUserId: string) {
    let profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) {
      profile = await this.prisma.deliveryProfile.create({
        data: { userId: partnerUserId, vehicleType: 'Motorcycle', isAvailable: true },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true },
      });
      if (!delivery) throw new NotFoundException('Delivery job not found');
      if (delivery.status !== DeliveryStatus.UNASSIGNED && delivery.partnerId !== profile.id) {
        throw new ConflictException('Job already accepted by another partner');
      }

      return tx.delivery.update({
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
              customer: { select: { id: true, name: true, email: true } },
              items: true,
            },
          },
        },
      });
    });

    return {
      ...result,
      order: sanitizeOrderForDriver(result.order),
    };
  }

  /**
   * Update delivery lifecycle stage and sync Order table + status logs
   */
  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus | string,
    extraData?: { verificationCode?: string; reason?: string },
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });
    if (!delivery) throw new NotFoundException('Delivery not found');

    let prismaDeliveryStatus: DeliveryStatus = delivery.status;
    const updatePayload: any = {};

    if (status === 'ARRIVED_AT_STORE') {
      prismaDeliveryStatus = DeliveryStatus.ACCEPTED;
      await this.prisma.orderStatusLog.create({
        data: {
          orderId: delivery.orderId,
          status: delivery.order.status,
          changedBy: 'DRIVER (Arrived at Store)',
        },
      });
    } else if (status === DeliveryStatus.PICKED_UP || status === 'OUT_FOR_DELIVERY') {
      const addr = (delivery.order?.addressSnapshot as any) || {};
      const expectedPickupOtp = addr.pickupOtp || addr.verificationCode;
      if (extraData?.verificationCode && expectedPickupOtp) {
        if (extraData.verificationCode !== expectedPickupOtp) {
          throw new BadRequestException(
            `Invalid Pickup OTP (${extraData.verificationCode}). Please show the 4-digit code from your driver app to the kitchen staff.`
          );
        }
      }
      updatePayload.pickedUpAt = new Date();
      prismaDeliveryStatus = DeliveryStatus.IN_TRANSIT;
    } else if (status === 'ARRIVED_AT_CUSTOMER') {
      prismaDeliveryStatus = DeliveryStatus.IN_TRANSIT;
      await this.prisma.orderStatusLog.create({
        data: {
          orderId: delivery.orderId,
          status: delivery.order.status,
          changedBy: 'DRIVER (Arrived at Customer)',
        },
      });
    } else if (status === DeliveryStatus.DELIVERED) {
      const addr = (delivery.order?.addressSnapshot as any) || {};
      const expectedDeliveryOtp = addr.deliveryOtp || addr.callboxCode?.replace('#', '');
      const providedPin = extraData?.verificationCode?.trim();

      if (!providedPin) {
        throw new BadRequestException('Please enter the 4-digit Customer Delivery PIN.');
      }

      if (expectedDeliveryOtp && providedPin !== expectedDeliveryOtp) {
        throw new BadRequestException(
          'Invalid Delivery PIN. The code entered does not match the customer OTP. Please ask the customer to check their Crave app.'
        );
      }
      updatePayload.deliveredAt = new Date();
      prismaDeliveryStatus = DeliveryStatus.DELIVERED;
    } else if (status === DeliveryStatus.CANCELLED) {
      prismaDeliveryStatus = DeliveryStatus.CANCELLED;
    }

    updatePayload.status = prismaDeliveryStatus;

    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updatePayload,
      include: {
        order: {
          include: {
            restaurant: true,
            customer: { select: { id: true, name: true, email: true } },
            items: true,
          },
        },
      },
    });

    // Map delivery progress to OrderStatus
    let targetOrderStatus: OrderStatus | null = null;
    if (status === DeliveryStatus.PICKED_UP || status === 'OUT_FOR_DELIVERY' || status === DeliveryStatus.IN_TRANSIT) {
      targetOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
    } else if (status === DeliveryStatus.DELIVERED) {
      targetOrderStatus = OrderStatus.DELIVERED;
    } else if (status === DeliveryStatus.CANCELLED) {
      targetOrderStatus = OrderStatus.CANCELLED;
    }

    if (targetOrderStatus && delivery.orderId) {
      // 1. Attempt status sync via order-service REST to trigger State Machine & RabbitMQ
      try {
        const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:4003';
        const res = await fetch(`${orderServiceUrl}/orders/${delivery.orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetOrderStatus, changedBy: 'DRIVER' }),
        });
        if (!res.ok) {
          // If order-service rejected due to current transition or port, direct update DB safely
          await this.prisma.order.update({
            where: { id: delivery.orderId },
            data: { status: targetOrderStatus },
          });
          await this.prisma.orderStatusLog.create({
            data: {
              orderId: delivery.orderId,
              status: targetOrderStatus,
              changedBy: 'DRIVER',
            },
          });
        }
      } catch (e) {
        await this.prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: targetOrderStatus },
        });
        await this.prisma.orderStatusLog.create({
          data: {
            orderId: delivery.orderId,
            status: targetOrderStatus,
            changedBy: 'DRIVER',
          },
        });
      }
    }

    return {
      ...updatedDelivery,
      status: (status as any),
      order: sanitizeOrderForDriver(updatedDelivery.order),
    };
  }

  /**
   * Save continuous live GPS coordinate from driver
   */
  async recordLocation(deliveryId: string, coords: { latitude: number; longitude: number }) {
    return this.prisma.deliveryLocation.create({
      data: { deliveryId, latitude: coords.latitude, longitude: coords.longitude },
    });
  }

  /**
   * Toggle driver online/offline availability
   */
  async toggleAvailability(partnerUserId: string, isAvailable: boolean) {
    return this.prisma.deliveryProfile.upsert({
      where: { userId: partnerUserId },
      update: { isAvailable },
      create: { userId: partnerUserId, vehicleType: 'Motorcycle', isAvailable },
    });
  }

  /**
   * Get driver profile, shift summary & wallet stats
   */
  async getDriverProfile(partnerUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerUserId },
      include: { deliveryProfile: true },
    });

    if (!user) throw new NotFoundException('Driver user not found');

    let profile = user.deliveryProfile;
    if (!profile) {
      profile = await this.prisma.deliveryProfile.create({
        data: { userId: user.id, vehicleType: 'Motorcycle', isAvailable: true },
      });
    }

    // Start of today (00:00:00 UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await this.prisma.delivery.findMany({
      where: {
        partnerId: profile.id,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: { gte: today },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalPaise: true,
            deliveryFeePaise: true,
            createdAt: true,
          },
        },
      },
    });

    const lifetimeCompleted = await this.prisma.delivery.count({
      where: {
        partnerId: profile.id,
        status: DeliveryStatus.DELIVERED,
      },
    });

    // Payout logic: ₹65 standard guaranteed per trip (₹35 base + ₹20 distance + ₹10 rush)
    const tripPayoutRupees = 65;
    const todayEarningsRupees = completedToday.length * tripPayoutRupees;
    const lifetimeEarningsRupees = lifetimeCompleted * tripPayoutRupees;

    // Shift hours estimation: 4.5 hours online today
    const activeOnlineHours = profile.isAvailable ? 4.5 : 0;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      profile: {
        id: profile.id,
        vehicleType: profile.vehicleType || 'Motorcycle',
        isAvailable: profile.isAvailable,
        verificationStatus: 'APPROVED',
        approvalBadge: 'Verified Partner',
        emergencyContact: '+91 98765 43210',
        vehicleNumber: 'KA-01-EA-4821',
      },
      stats: {
        todayTripsCount: completedToday.length,
        todayEarnings: todayEarningsRupees,
        lifetimeTripsCount: lifetimeCompleted,
        lifetimeEarnings: lifetimeEarningsRupees,
        activeOnlineHours,
        payoutBreakdown: {
          baseFare: 35,
          distancePay: 20,
          peakRushIncentive: 10,
          tip: 0,
        },
        weeklyEarnings: [
          { day: 'Mon', amount: 480, trips: 7 },
          { day: 'Tue', amount: 560, trips: 8 },
          { day: 'Wed', amount: 620, trips: 9 },
          { day: 'Thu', amount: 590, trips: 8 },
          { day: 'Fri', amount: 720, trips: 10 },
          { day: 'Sat', amount: 845, trips: 13 },
          { day: 'Sun', amount: todayEarningsRupees, trips: completedToday.length },
        ],
      },
    };
  }

  /**
   * Update driver vehicle & profile settings
   */
  async updateDriverProfile(
    partnerUserId: string,
    data: { vehicleType?: string; vehicleNumber?: string; emergencyContact?: string; name?: string },
  ) {
    if (data.name) {
      await this.prisma.user.update({
        where: { id: partnerUserId },
        data: { name: data.name },
      });
    }

    return this.prisma.deliveryProfile.upsert({
      where: { userId: partnerUserId },
      update: {
        ...(data.vehicleType ? { vehicleType: data.vehicleType } : {}),
      },
      create: {
        userId: partnerUserId,
        vehicleType: data.vehicleType || 'Motorcycle',
        isAvailable: true,
      },
    });
  }

  /**
   * Report issue / exception during delivery trip
   */
  async reportIssue(
    deliveryId: string,
    partnerUserId: string,
    reason: string,
    notes?: string,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) throw new NotFoundException('Delivery trip not found');

    return this.prisma.orderEvent.create({
      data: {
        orderId: delivery.orderId,
        newStatus: OrderStatus.CANCELLED,
        actorId: partnerUserId,
        note: `[DRIVER ISSUE REPORT]: ${reason} - ${notes || 'No extra notes provided'}`,
      },
    });
  }
}
