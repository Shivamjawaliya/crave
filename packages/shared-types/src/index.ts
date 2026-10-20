/**
 * Core Enums
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
  ADMIN = 'ADMIN'
}

export enum RestaurantStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED'
}

export enum DeliveryStatus {
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

/**
 * Common Interfaces
 */
export interface AddressSnapshot {
  label?: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface MenuItemSummary {
  id: string;
  name: string;
  description?: string | null;
  pricePaise: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  categoryId: string;
}

export interface MenuCategorySummary {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items: MenuItemSummary[];
}

export interface RestaurantSummary {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: RestaurantStatus;
  isAcceptingOrders?: boolean;
  createdAt: string;
}

export interface OrderItemSummary {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  addressSnapshot: AddressSnapshot;
  items: OrderItemSummary[];
  createdAt: string;
}

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  recordedAt?: string;
}

/**
 * Socket.IO Events
 */
export const SocketEvents = {
  ORDER_SUBSCRIBE: 'order:subscribe',
  ORDER_UNSUBSCRIBE: 'order:unsubscribe',
  ORDER_STATUS: 'order:status',
  DELIVERY_LOCATION: 'delivery:location',
} as const;

/**
 * RabbitMQ Events
 */
export const RabbitMQEvents = {
  ORDER_PLACED: 'order.placed',
  ORDER_ACCEPTED: 'order.accepted',
  ORDER_REJECTED: 'order.rejected',
  ORDER_READY_FOR_PICKUP: 'order.ready_for_pickup',
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_PICKED_UP: 'delivery.picked_up',
  DELIVERY_COMPLETED: 'delivery.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUND_UPDATED: 'payment.refund_updated',
} as const;

/**
 * API Response Interfaces
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
