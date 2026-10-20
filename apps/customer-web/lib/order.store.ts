import { create } from 'zustand';

export interface ActiveOrderItem {
  name: string;
  quantity: number;
  pricePaise: number;
  subtitle?: string;
  imageUrl?: string;
}

export interface ActiveOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  status: 'PLACED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED';
  statusText: string;
  etaMinutes: string; // e.g. "14–19 min"
  etaTime: string; // e.g. "7:42 PM"
  driverDistance: string; // e.g. "1.8 miles away"
  placedAt?: string;
  preppedAt?: string;
  deliveredAt?: string;
  items: ActiveOrderItem[];
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  tipPaise: number;
  totalPaise: number;
  deliveryAddress: {
    addressLine: string;
    label?: string;
    city?: string;
    instructions?: string;
    deliveryOtp?: string;
  };
  courier: {
    name: string;
    phone: string;
    vehicle: string;
    rating: string;
    photoUrl?: string;
    note: string;
  };
}

export const DEFAULT_ACTIVE_ORDER: ActiveOrder = {
  id: 'cmvgdgyzn000fp47p18l12v9r',
  orderNumber: 'ORD-947855-5255',
  restaurantId: 'cmvee935z0006hd1gmf1pea4s',
  restaurantName: 'Juicy Cafe',
  restaurantAddress: 'Dev adhikari , nehru nagar , bhopal',
  status: 'DELIVERED',
  statusText: 'Delivered Safely 🎉',
  etaMinutes: 'Delivered',
  etaTime: '1:22 PM',
  driverDistance: 'Delivered at Doorstep',
  placedAt: '1:09 PM',
  preppedAt: '1:20 PM',
  deliveredAt: '1:22 PM',
  items: [
    {
      name: 'Fresh Mint Lime Soda',
      quantity: 2,
      pricePaise: 12000,
      subtitle: 'Chilled freshly squeezed juice',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&auto=format&fit=crop&q=80',
    },
  ],
  subtotalPaise: 24000,
  deliveryFeePaise: 4000,
  taxPaise: 1200,
  tipPaise: 0,
  totalPaise: 29200,
  deliveryAddress: {
    label: 'Home',
    addressLine: 'd/2, Near Nehru nagar, d/2 Nehru nagar',
    city: 'Bhopal',
    instructions: 'Please leave package on the bench next to Apt 4B door. Ring bell once.',
    deliveryOtp: '3497',
  },
  courier: {
    name: 'Marcus Chen',
    phone: '+91 98260 12345',
    vehicle: 'Silver Honda Civic • 7XYZ99',
    rating: '4.98',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    note: 'Order delivered successfully at your door. Enjoy!',
  },
};

interface OrderStore {
  activeOrder: ActiveOrder | null;
  isBannerDismissed: boolean;
  hydrateFromStorage: () => void;
  setActiveOrder: (order: ActiveOrder | null) => void;
  dismissBanner: () => void;
  showBanner: () => void;
  updateOrderStatus: (status: ActiveOrder['status']) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  activeOrder: null,
  isBannerDismissed: false,

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('crave_active_order');
      if (stored) {
        set({ activeOrder: JSON.parse(stored) });
      } else {
        set({ activeOrder: null });
      }
    } catch {}
  },

  setActiveOrder: (order) => {
    if (typeof window !== 'undefined') {
      if (order) {
        localStorage.setItem('crave_active_order', JSON.stringify(order));
      } else {
        localStorage.removeItem('crave_active_order');
      }
    }
    set({ activeOrder: order, isBannerDismissed: false });
  },

  dismissBanner: () => {
    set({ isBannerDismissed: true });
  },

  showBanner: () => {
    set({ isBannerDismissed: false });
  },

  updateOrderStatus: (status) => {
    set((state) => {
      const baseOrder = state.activeOrder || DEFAULT_ACTIVE_ORDER;
      const statusTextMap: Record<ActiveOrder['status'], string> = {
        PLACED: 'Order Placed • Waiting for Kitchen',
        PREPARING: 'Kitchen Prepping Your Feast',
        ON_THE_WAY: 'On The Way (Marcus En Route)',
        DELIVERED: 'Delivered Safely 🎉',
      };

      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      let etaMinutes = baseOrder.etaMinutes;
      let driverDistance = baseOrder.driverDistance;
      if (status === 'PLACED') {
        etaMinutes = '35–45 min';
        driverDistance = 'Awaiting Kitchen';
      } else if (status === 'PREPARING') {
        etaMinutes = '25–30 min';
        driverDistance = 'Driver Heading to Restaurant';
      } else if (status === 'ON_THE_WAY') {
        etaMinutes = '14–19 min';
        driverDistance = '1.8 miles away';
      } else if (status === 'DELIVERED') {
        etaMinutes = 'Delivered';
        driverDistance = 'Delivered at Doorstep';
      }

      const updated: ActiveOrder = {
        ...baseOrder,
        status,
        statusText: statusTextMap[status],
        etaMinutes,
        driverDistance,
        placedAt: baseOrder.placedAt || '7:18 PM',
        preppedAt:
          status === 'PREPARING' || status === 'ON_THE_WAY' || status === 'DELIVERED'
            ? baseOrder.preppedAt || nowStr
            : undefined,
        deliveredAt: status === 'DELIVERED' ? baseOrder.deliveredAt || nowStr : undefined,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('crave_active_order', JSON.stringify(updated));
      }
      return { activeOrder: updated };
    });
  },
}));
