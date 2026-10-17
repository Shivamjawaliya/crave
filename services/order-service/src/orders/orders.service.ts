import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@food-platform/shared-types';
import { isValidOrderTransition } from '@food-platform/validation';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateQuote(restaurantId: string, items: Array<{ menuItemId: string; quantity: number }>) {
    const itemIds = items.map((i) => i.menuItemId);
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

    for (const input of items) {
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

  async createOrder(customerId: string, data: { restaurantId: string; address: any; items: any[] }) {
    const quote = await this.calculateQuote(data.restaurantId, data.items);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
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
            create: quote.items.map((i) => ({
              menuItemId: i.menuItemId,
              itemName: i.itemName,
              unitPricePaise: i.unitPricePaise,
              quantity: i.quantity,
              lineTotalPaise: i.lineTotalPaise,
            })),
          },
          payment: { create: { amountPaise: quote.totalPaise } },
          delivery: { create: { status: 'UNASSIGNED' } },
        },
        include: { items: true, payment: true, delivery: true },
      });
      return order;
    });
  }

  async updateStatus(orderId: string, nextStatus: OrderStatus, actorId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (!isValidOrderTransition(order.status as OrderStatus, nextStatus)) {
      throw new BadRequestException(`Invalid transition: ${order.status} -> ${nextStatus}`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: { items: true, delivery: true },
    });
  }

  async findOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true, delivery: true, restaurant: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
