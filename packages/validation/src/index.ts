import { z } from 'zod';
import { OrderStatus, DeliveryStatus, UserRole } from '@food-platform/shared-types';

/**
 * Currency conversion utilities (Paise <-> INR)
 */
export const rupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

export const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

export const formatPaiseToCurrency = (paise: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
};

/**
 * Order State Machine Validation
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PLACED, OrderStatus.CANCELLED],
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: []
};

export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  const allowed = ALLOWED_ORDER_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Zod Schemas for Validation
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const addressSnapshotSchema = z.object({
  label: z.string().optional(),
  addressLine: z.string().min(5, 'Address line is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional()
});

export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const createOrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive().max(50)
});

export const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  address: addressSnapshotSchema,
  items: z.array(createOrderItemSchema).min(1, 'Order must contain at least one item')
});
