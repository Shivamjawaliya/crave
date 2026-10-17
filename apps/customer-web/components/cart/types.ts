export type DropoffMode = 'meet' | 'leave';
export type DeliverySpeed = 'priority' | 'standard' | 'schedule';
export type PaymentMethod = 'card' | 'applepay' | 'googlepay';

export interface CheckoutQuote {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  platformFee: number;
  tipAmount: number;
  taxAmount: number;
  craveCashDiscount: number;
  totalAmount: number;
}
