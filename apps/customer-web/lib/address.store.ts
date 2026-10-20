import { create } from 'zustand';

export interface UserAddress {
  id?: string;
  userId?: string;
  label: string;
  houseNumber?: string | null;
  landmark?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  addressLine: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_FALLBACK_ADDRESS: UserAddress = {
  id: 'default-fallback',
  label: 'Home',
  addressLine: '742 Evergreen Terrace, Apt 4B',
  city: 'Springfield',
  state: 'OR',
  pincode: '97477',
  isDefault: true,
};

interface AddressStore {
  addresses: UserAddress[];
  selectedAddress: UserAddress;
  isHydrated: boolean;
  isLoading: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  hydrateFromStorage: () => void;
  fetchAddresses: (userId: string) => Promise<void>;
  selectAddress: (address: UserAddress) => void;
  addAddress: (
    userId: string,
    data: {
      label?: string;
      houseNumber?: string;
      landmark?: string;
      contactName?: string;
      contactPhone?: string;
      addressLine: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    },
  ) => Promise<UserAddress>;
  setDefaultAddress: (userId: string, addressId: string) => Promise<void>;
  deleteAddress: (userId: string, addressId: string) => Promise<void>;
}

const API_BASE = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: [DEFAULT_FALLBACK_ADDRESS],
  selectedAddress: DEFAULT_FALLBACK_ADDRESS,
  isHydrated: false,
  isLoading: false,
  isModalOpen: false,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('crave_selected_address');
      if (saved) {
        set({ selectedAddress: JSON.parse(saved), isHydrated: true });
        return;
      }
    } catch {}
    set({ isHydrated: true });
  },

    fetchAddresses: async (userId: string) => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/addresses`);
        if (!res.ok) throw new Error('Failed to fetch addresses');
        const data: UserAddress[] = await res.json();

        if (data.length > 0) {
          set({ addresses: data });

          // Keep current selection if it exists in the fetched list, otherwise default to default address
          const current = get().selectedAddress;
          const matched = data.find((a) => a.id === current.id);
          const defaultAddr = data.find((a) => a.isDefault) || data[0];

          const active = matched || defaultAddr;
          set({ selectedAddress: active });
          if (typeof window !== 'undefined') {
            localStorage.setItem('crave_selected_address', JSON.stringify(active));
          }
        } else {
          // If no address in DB, keep fallback
          set({ addresses: [DEFAULT_FALLBACK_ADDRESS], selectedAddress: DEFAULT_FALLBACK_ADDRESS });
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        set({ isLoading: false });
      }
    },

    selectAddress: (address: UserAddress) => {
      set({ selectedAddress: address });
      if (typeof window !== 'undefined') {
        localStorage.setItem('crave_selected_address', JSON.stringify(address));
      }
    },

    addAddress: async (userId: string, data) => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to add address');
        }

        const newAddress: UserAddress = await res.json();

        // Refresh list
        await get().fetchAddresses(userId);
        get().selectAddress(newAddress);
        return newAddress;
      } finally {
        set({ isLoading: false });
      }
    },

    setDefaultAddress: async (userId: string, addressId: string) => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/addresses/${addressId}/default`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to set default address');
        }

        await get().fetchAddresses(userId);
      } finally {
        set({ isLoading: false });
      }
    },

    deleteAddress: async (userId: string, addressId: string) => {
      set({ isLoading: true });
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/addresses/${addressId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to delete address');
        }

        await get().fetchAddresses(userId);
      } finally {
        set({ isLoading: false });
      }
    },
}));
