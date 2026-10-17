import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string | null;
}

interface CartStore {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, restaurantName: string, item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  getSubtotalPaise: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  restaurantId: null,
  restaurantName: null,
  items: [],

  addItem: (restaurantId, restaurantName, item) => {
    set((state) => {
      // Clear cart if ordering from a different restaurant
      const items = state.restaurantId === restaurantId ? [...state.items] : [];
      const existing = items.find((i) => i.menuItemId === item.menuItemId);

      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({ ...item, quantity: 1 });
      }

      return {
        restaurantId,
        restaurantName,
        items,
      };
    });
  },

  updateQuantity: (menuItemId, delta) => {
    set((state) => {
      const items = state.items
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      return {
        items,
        restaurantId: items.length === 0 ? null : state.restaurantId,
        restaurantName: items.length === 0 ? null : state.restaurantName,
      };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => {
      const items = state.items.filter((item) => item.menuItemId !== menuItemId);
      return {
        items,
        restaurantId: items.length === 0 ? null : state.restaurantId,
        restaurantName: items.length === 0 ? null : state.restaurantName,
      };
    });
  },

  clearCart: () => set({ restaurantId: null, restaurantName: null, items: [] }),

  getSubtotalPaise: () => {
    return get().items.reduce((acc, curr) => acc + curr.pricePaise * curr.quantity, 0);
  },
}));
