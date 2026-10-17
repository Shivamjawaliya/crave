import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuoteItemInput {
  menuItemId: string;
  quantity: number;
}

export interface QuoteRequest {
  restaurantId: string;
  items: QuoteItemInput[];
}

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateQuote(request: QuoteRequest) {
    if (!request.items || request.items.length === 0) {
      throw new BadRequestException('Quote requires at least one item');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: request.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const itemIds = request.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: { category: true },
    });

    const itemMap = new Map(menuItems.map((item) => [item.id, item]));

    let subtotalPaise = 0;
    const validatedItems: Array<{
      menuItemId: string;
      itemName: string;
      unitPricePaise: number;
      quantity: number;
      lineTotalPaise: number;
    }> = [];

    for (const input of request.items) {
      const item = itemMap.get(input.menuItemId);
      if (!item) {
        throw new BadRequestException(`Item ${input.menuItemId} does not exist`);
      }

      if (item.category.restaurantId !== request.restaurantId) {
        throw new BadRequestException(
          `Item ${item.name} does not belong to the selected restaurant`,
        );
      }

      if (!item.isAvailable) {
        throw new BadRequestException(`Item "${item.name}" is currently unavailable`);
      }

      if (input.quantity < 1 || input.quantity > 50) {
        throw new BadRequestException(`Invalid quantity for ${item.name}`);
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

    // Business calculations:
    // Delivery fee: ₹40 (4000 paise), free if subtotal >= ₹500 (50000 paise)
    const deliveryFeePaise = subtotalPaise >= 50000 ? 0 : 4000;
    // 5% GST on food
    const taxPaise = Math.round(subtotalPaise * 0.05);
    const totalPaise = subtotalPaise + deliveryFeePaise + taxPaise;

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: validatedItems,
      subtotalPaise,
      deliveryFeePaise,
      taxPaise,
      totalPaise,
    };
  }
}
