import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InProcessOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateQuote(restaurantId: string, items: Array<{ menuItemId: string; quantity: number }>) {
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

  async createOrder(customerId: string, data: { restaurantId: string; address: any; items: any[]; status?: any }) {
    const quote = await this.calculateQuote(data.restaurantId, data.items);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

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
      verificationCode: pickupOtp,
      callboxCode: `#${deliveryOtp}`,
      customerPhone,
    };

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          restaurantId: data.restaurantId,
          status: data.status || ('PLACED' as any),
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
        },
        include: {
          items: true,
          restaurant: { select: { id: true, name: true, address: true } },
          customer: { select: { id: true, name: true, email: true } },
        },
      });

      return created;
    });
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRestaurantOrders(restaurantId: string) {
    return this.prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: true,
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, address: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(id: string, status: any) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true } },
      },
    });
  }
}
