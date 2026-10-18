import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
export class InProcessDeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableJobs() {
    const jobs = await this.prisma.delivery.findMany({
      where: {
        status: 'UNASSIGNED' as any,
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

  async getActiveTrip(partnerUserId: string) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    if (!profile) return null;

    const delivery = await this.prisma.delivery.findFirst({
      where: {
        partnerId: profile.id,
        status: {
          in: ['ASSIGNED', 'PICKED_UP', 'AT_LOCATION'] as any[],
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
    });

    return delivery ? { ...delivery, order: sanitizeOrderForDriver(delivery.order) } : null;
  }

  async acceptJob(jobId: string, partnerUserId: string) {
    const profile = await this.prisma.deliveryProfile.findUnique({
      where: { userId: partnerUserId },
    });

    return this.prisma.delivery.update({
      where: { id: jobId },
      data: {
        partnerId: profile ? profile.id : null,
        status: 'ASSIGNED' as any,
        assignedAt: new Date(),
      },
      include: {
        order: {
          include: {
            restaurant: true,
            customer: true,
          },
        },
      },
    });
  }

  async updateStatus(jobId: string, status: any) {
    const data: any = { status };
    if (status === 'PICKED_UP') data.pickedUpAt = new Date();
    if (status === 'DELIVERED') data.deliveredAt = new Date();

    return this.prisma.delivery.update({
      where: { id: jobId },
      data,
      include: {
        order: true,
      },
    });
  }
}
