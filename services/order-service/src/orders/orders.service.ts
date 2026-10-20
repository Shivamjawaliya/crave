import { Injectable, NotFoundException, BadRequestException, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, RabbitMQEvents } from '@food-platform/shared-types';
import { isValidOrderTransition } from '@food-platform/validation';

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initRabbitMQ();
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch {}
  }

  private async initRabbitMQ() {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange('food_events', 'topic', { durable: true });
      this.logger.log('🐰 OrderService: RabbitMQ publisher connected and exchange asserted');
    } catch (e: any) {
      this.logger.warn(`RabbitMQ not available: ${e.message}. Orders will proceed in database.`);
    }
  }

  async publishOrderEvent(routingKey: string, payload: any) {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ channel not connected. Skipping publish for [${routingKey}]`);
      return;
    }
    try {
      const message = Buffer.from(
        JSON.stringify({
          event: routingKey,
          timestamp: new Date().toISOString(),
          payload,
        })
      );
      this.channel.publish('food_events', routingKey, message, { persistent: true });
      this.logger.log(`🐰 Published RabbitMQ event [${routingKey}] for order ${payload.orderNumber || payload.id}`);
    } catch (err: any) {
      this.logger.error(`Failed to publish event to RabbitMQ: ${err.message}`);
    }
  }

  async calculateQuote(restaurantId: string, items: Array<{ menuItemId: string; quantity: number }>) {
    // Sanitize item IDs: strip off any timestamp suffixes (e.g. cuid-1792210385766 -> cuid)
    const sanitizedInputs = items.map((i) => ({
      ...i,
      menuItemId: (i.menuItemId || '').replace(/-[0-9]{10,}$/, '').trim(),
    }));
    const itemIds = sanitizedInputs.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });
    const map = new Map(menuItems.map((m) => [m.id, m]));

    let subtotalPaise = 0;
    const validatedItems: Array<{
      menuItemId: string;
      itemName: string;
      unitPricePaise: number;
      quantity: number;
      lineTotalPaise: number;
    }> = [];

    for (const input of sanitizedInputs) {
      const item = map.get(input.menuItemId);
      if (!item || !item.isAvailable) {
        throw new BadRequestException(`Item ${input.menuItemId} is invalid or unavailable`);
      }
      const lineTotal = item.pricePaise * input.quantity;
      subtotalPaise += lineTotal;
      validatedItems.push({
        menuItemId: item.id,
        itemName: item.name,
        unitPricePaise: item.pricePaise,
        quantity: input.quantity,
        lineTotalPaise: lineTotal,
      });
    }

    const deliveryFeePaise = subtotalPaise >= 50000 ? 0 : 4000;
    const taxPaise = Math.round(subtotalPaise * 0.05);
    const totalPaise = subtotalPaise + deliveryFeePaise + taxPaise;

    return { items: validatedItems, subtotalPaise, deliveryFeePaise, taxPaise, totalPaise };
  }

  async createOrder(customerId: string, data: { restaurantId: string; address: any; items: any[]; status?: OrderStatus }) {
    const quote = await this.calculateQuote(data.restaurantId, data.items);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate unique fresh 4-digit OTPs for every single order
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const incomingAddress = typeof data.address === 'object' && data.address !== null ? data.address : {};
    const customerPhone =
      incomingAddress.customerPhone ||
      incomingAddress.phone ||
      incomingAddress.phoneNumber ||
      '+91 98260 12345';

    const addressSnapshot = {
      ...incomingAddress,
      pickupOtp,
      deliveryOtp,
      verificationCode: pickupOtp, // for restaurant KDS pickup compatibility
      callboxCode: `#${deliveryOtp}`, // for delivery PIN compatibility
      customerPhone,
    };

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          restaurantId: data.restaurantId,
          status: data.status || OrderStatus.PLACED,
          subtotalPaise: quote.subtotalPaise,
          deliveryFeePaise: quote.deliveryFeePaise,
          taxPaise: quote.taxPaise,
          totalPaise: quote.totalPaise,
          addressSnapshot,
          items: {
            create: quote.items.map((i) => ({
              menuItemId: i.menuItemId,
              itemName: i.itemName,
              unitPricePaise: i.unitPricePaise,
              quantity: i.quantity,
              lineTotalPaise: i.lineTotalPaise,
            })),
          },
          statusLogs: {
            create: {
              status: data.status || OrderStatus.PLACED,
              changedBy: 'CUSTOMER',
            },
          },
          payment: { create: { amountPaise: quote.totalPaise, status: 'PAID' } },
          delivery: { create: { status: 'UNASSIGNED' } },
        },
        include: {
          items: true,
          payment: true,
          delivery: true,
          customer: { select: { id: true, name: true, email: true } },
          restaurant: true,
          statusLogs: { orderBy: { createdAt: 'asc' } },
        },
      });
      return created;
    });

    // 🐰 Broadcast event to RabbitMQ
    await this.publishOrderEvent(RabbitMQEvents.ORDER_PLACED, {
      id: order.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      customerId: order.customerId,
      customer: order.customer,
      status: order.status,
      newStatus: order.status,
      changedBy: 'CUSTOMER',
      timestamp: new Date().toISOString(),
      subtotalPaise: order.subtotalPaise,
      deliveryFeePaise: order.deliveryFeePaise,
      taxPaise: order.taxPaise,
      totalPaise: order.totalPaise,
      addressSnapshot: order.addressSnapshot,
      items: order.items,
      createdAt: order.createdAt,
    });

    return order;
  }

  async updateStatus(
    orderId: string,
    nextStatus: OrderStatus,
    changedBy: string = 'RESTAURANT',
    actorId?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === nextStatus) {
      return order;
    }

    if (!isValidOrderTransition(order.status as OrderStatus, nextStatus)) {
      throw new BadRequestException(`Invalid transition: ${order.status} -> ${nextStatus}`);
    }

    // Fast atomic batch transaction (1 single roundtrip to remote PostgreSQL database)
    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: {
          items: true,
          delivery: true,
          customer: { select: { id: true, name: true, email: true } },
          restaurant: true,
        },
      }),
      this.prisma.orderStatusLog.create({
        data: {
          orderId: orderId,
          status: nextStatus,
          changedBy: changedBy || 'RESTAURANT',
        },
      }),
    ]);

    // 🐰 Broadcast status transition to RabbitMQ (non-blocking)
    this.publishOrderEvent(`order.${nextStatus.toLowerCase()}`, {
      id: updated.id,
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      restaurantId: updated.restaurantId,
      customerId: updated.customerId,
      customer: updated.customer,
      status: updated.status,
      newStatus: updated.status,
      changedBy: changedBy || 'RESTAURANT',
      timestamp: new Date().toISOString(),
      subtotalPaise: updated.subtotalPaise,
      deliveryFeePaise: updated.deliveryFeePaise,
      taxPaise: updated.taxPaise,
      totalPaise: updated.totalPaise,
      addressSnapshot: updated.addressSnapshot,
      items: updated.items,
      createdAt: updated.createdAt,
    }).catch((err) =>
      this.logger.error(`Failed to publish event to RabbitMQ: ${err.message}`),
    );

    return updated;
  }

  async getOrderLogs(orderId: string) {
    return this.prisma.orderStatusLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        delivery: true,
        restaurant: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payment: true,
        delivery: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
          },
        },
      },
    });
  }

  async getRestaurantOrders(restaurantId: string) {
    return this.prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: true,
        delivery: true,
      },
    });
  }
}
