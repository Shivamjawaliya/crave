import { Injectable } from '@nestjs/common';

export interface CartItem {
  menuItemId: string;
  name: string;
  pricePaise: number;
  quantity: number;
}

export interface CartState {
  restaurantId?: string;
  items: CartItem[];
}

@Injectable()
export class CartService {
  // In-memory / session cart storage with support for Redis extension
  private userCarts = new Map<string, CartState>();

  async getCart(userId: string): Promise<CartState> {
    return this.userCarts.get(userId) || { items: [] };
  }

  async updateItem(
    userId: string,
    restaurantId: string,
    item: CartItem,
  ): Promise<CartState> {
    let cart = this.userCarts.get(userId);

    // If switching restaurants, clear previous restaurant's items
    if (!cart || cart.restaurantId !== restaurantId) {
      cart = { restaurantId, items: [] };
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.menuItemId === item.menuItemId,
    );

    if (existingIndex > -1) {
      if (item.quantity <= 0) {
        cart.items.splice(existingIndex, 1);
      } else {
        cart.items[existingIndex].quantity = item.quantity;
      }
    } else if (item.quantity > 0) {
      cart.items.push(item);
    }

    if (cart.items.length === 0) {
      cart.restaurantId = undefined;
    }

    this.userCarts.set(userId, cart);
    return cart;
  }

  async removeItem(userId: string, itemId: string): Promise<CartState> {
    const cart = this.userCarts.get(userId);
    if (!cart) return { items: [] };

    cart.items = cart.items.filter((i) => i.menuItemId !== itemId);
    if (cart.items.length === 0) {
      cart.restaurantId = undefined;
    }

    this.userCarts.set(userId, cart);
    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    this.userCarts.delete(userId);
  }
}
