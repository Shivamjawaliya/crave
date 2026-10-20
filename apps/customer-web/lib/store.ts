import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string | null;
  subtitle?: string;
}

export const STITCH_DEFAULT_CART_ITEMS: CartItem[] = [
  {
    menuItemId: 'tonkotsu',
    name: 'Black Garlic Truffle Tonkotsu',
    pricePaise: 2225, // $22.25
    quantity: 1,
    subtitle: 'Extra Ajitsuke Tamago, Firm Noodles',
  },
  {
    menuItemId: 'gyoza',
    name: 'Pan-Seared Wagyu Gyoza',
    pricePaise: 1100, // $11.00
    quantity: 1,
    subtitle: '5 pcs, Rayu Chili crisp vinegar',
  },
  {
    menuItemId: 'yuzu',
    name: 'Yuzu Sparkling Soda',
    pricePaise: 450, // $4.50
    quantity: 1,
    subtitle: 'Chilled, Fresh Mint Sprig',
  },
];

interface CartStore {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, restaurantName: string, item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  hydrateFromStorage: () => void;
  getSubtotalPaise: () => number;
}

const saveToLocalStorage = (items: CartItem[], restId: string | null, restName: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('crave_cart_items', JSON.stringify(items));
    if (restId) localStorage.setItem('crave_cart_restaurant_id', restId);
    else localStorage.removeItem('crave_cart_restaurant_id');
    if (restName) localStorage.setItem('crave_cart_restaurant_name', restName);
    else localStorage.removeItem('crave_cart_restaurant_name');
  } catch {}
};

export const useCartStore = create<CartStore>((set, get) => ({
  restaurantId: 'rest-umai',
  restaurantName: 'Umai Handcrafted Ramen',
  items: STITCH_DEFAULT_CART_ITEMS,

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('crave_cart_items');
      const restId = localStorage.getItem('crave_cart_restaurant_id');
      const restName = localStorage.getItem('crave_cart_restaurant_name');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({
            items: parsed,
            restaurantId: restId ?? (parsed.length > 0 ? 'rest-umai' : null),
            restaurantName: restName ?? (parsed.length > 0 ? 'Umai Handcrafted Ramen' : null),
          });
        }
      }
    } catch {}
  },

  addItem: (restaurantId, restaurantName, item, quantity = 1) => {
    set((state) => {
      // Clear cart if ordering from a different restaurant
      const items = state.restaurantId === restaurantId ? [...state.items] : [];
      const existing = items.find((i) => i.menuItemId === item.menuItemId);

      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({ ...item, quantity });
      }

      saveToLocalStorage(items, restaurantId, restaurantName);

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

      const nextRestId = items.length === 0 ? null : state.restaurantId;
      const nextRestName = items.length === 0 ? null : state.restaurantName;

      saveToLocalStorage(items, nextRestId, nextRestName);

      return {
        items,
        restaurantId: nextRestId,
        restaurantName: nextRestName,
      };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => {
      const items = state.items.filter((item) => item.menuItemId !== menuItemId);
      const nextRestId = items.length === 0 ? null : state.restaurantId;
      const nextRestName = items.length === 0 ? null : state.restaurantName;

      saveToLocalStorage(items, nextRestId, nextRestName);

      return {
        items,
        restaurantId: nextRestId,
        restaurantName: nextRestName,
      };
    });
  },

  clearCart: () => {
    saveToLocalStorage([], null, null);
    set({ restaurantId: null, restaurantName: null, items: [] });
  },

  getSubtotalPaise: () => {
    return get().items.reduce((acc, curr) => acc + curr.pricePaise * curr.quantity, 0);
  },
}));
