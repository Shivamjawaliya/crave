import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutService } from '../checkout/checkout.service';
import { OrderStatus, UserRole } from '@food-platform/shared-types';
import { isValidOrderTransition } from '@food-platform/validation';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutService: CheckoutService,
  ) {}

  async createOrder(
    customerId: string,
    data: {
      restaurantId: string;
      address: {
        label?: string;
        addressLine: string;
        city?: string;
        state?: string;
        pincode?: string;
        latitude?: number;
        longitude?: number;
      };
      items: Array<{ menuItemId: string; quantity: number }>;
    },
  ) {
    // 1. Calculate price quote securely on server
    const quote = await this.checkoutService.calculateQuote({
      restaurantId: data.restaurantId,
      items: data.items,
    });

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    // 2. Perform transactional order creation
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          restaurantId: data.restaurantId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalPaise: quote.subtotalPaise,
          deliveryFeePaise: quote.deliveryFeePaise,
          taxPaise: quote.taxPaise,
          totalPaise: quote.totalPaise,
          addressSnapshot: data.address,
          items: {
            create: quote.items.map((item) => ({
              menuItemId: item.menuItemId,
              itemName: item.itemName,
              unitPricePaise: item.unitPricePaise,
              quantity: item.quantity,
              lineTotalPaise: item.lineTotalPaise,
            })),
          },
          payment: {
            create: {
              amountPaise: quote.totalPaise,
              provider: 'RAZORPAY',
            },
          },
          delivery: {
            create: {
              status: 'UNASSIGNED',
            },
          },
          events: {
            create: {
              oldStatus: null,
              newStatus: OrderStatus.PENDING_PAYMENT,
              actorId: customerId,
              note: 'Order created, awaiting payment',
            },
          },
        },
        include: {
          items: true,
          payment: true,
          delivery: true,
          restaurant: {
            select: { id: true, name: true, address: true },
          },
        },
      });

      return createdOrder;
    });

    return order;
  }

  async findCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true } },
        payment: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderById(orderId: string, userId: string, userRole: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: true,
        payment: true,
        delivery: {
          include: {
            locations: {
              take: 1,
              orderBy: { recordedAt: 'desc' },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      userRole === UserRole.CUSTOMER &&
      order.customerId !== userId
    ) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    if (
      userRole === UserRole.RESTAURANT_OWNER &&
      order.restaurant.ownerId !== userId
    ) {
      throw new ForbiddenException('You are not authorized to view this restaurant order');
    }

    return order;
  }

  async findOwnerOrders(ownerId: string, status?: OrderStatus) {
    const where: any = {
      restaurant: { ownerId },
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: true,
        payment: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    actorId: string,
    actorRole: UserRole,
    note?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      actorRole === UserRole.RESTAURANT_OWNER &&
      order.restaurant.ownerId !== actorId
    ) {
      throw new ForbiddenException('Not authorized for this restaurant');
    }

    if (!isValidOrderTransition(order.status as OrderStatus, nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${nextStatus}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: {
          items: true,
          restaurant: true,
          payment: true,
          delivery: true,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          oldStatus: order.status as OrderStatus,
          newStatus: nextStatus,
          actorId,
          note: note || `Status updated to ${nextStatus}`,
        },
      });

      return res;
    });

    return updated;
  }

  async cancelOrder(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Not authorized to cancel this order');
    }

    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.PLACED
    ) {
      throw new BadRequestException(
        'Order cannot be cancelled once accepted or prepared by the kitchen',
      );
    }

    return this.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      customerId,
      UserRole.CUSTOMER,
      'Cancelled by customer',
    );
  }
}
