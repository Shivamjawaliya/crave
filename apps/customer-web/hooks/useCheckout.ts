'use client';

import { useState, useMemo } from 'react';
import { useCartStore } from '../lib/store';
import { useAddressStore } from '../lib/address.store';
import { DropoffMode, DeliverySpeed, PaymentMethod } from '../components/cart/types';

export function useCheckout() {
  const {
    items: cartItems,
    restaurantName,
    restaurantId,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotalPaise,
  } = useCartStore();

  const { selectedAddress, openModal } = useAddressStore();

  // Step 1: Drop-off preference
  const [dropoffMode, setDropoffMode] = useState<DropoffMode>('leave');
  const [callboxCode, setCallboxCode] = useState('#4192');
  const [instructions, setInstructions] = useState(
    'Please leave package on the bench next to Apt 4B door. Ring bell once.',
  );

  // Step 2: Speed
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>('standard');

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [applyCraveCash, setApplyCraveCash] = useState(false);

  // Step 4: Tip & Voucher
  const [selectedTipPercent, setSelectedTipPercent] = useState<number>(18);
  const [customTip, setCustomTip] = useState<string>('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(true);

  // Order Placement State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');

  // Calculations
  const rawSubtotal = getSubtotalPaise() / 100;
  // If cart is empty for initial preview, show demo pricing or empty state
  const subtotal = rawSubtotal > 0 ? rawSubtotal : 37.75;
  const discount = voucherApplied ? 5.0 : 0.0;
  const deliveryFee = deliverySpeed === 'priority' ? 2.99 + 1.49 : 1.49;
  const platformFee = 3.2;

  const tipAmount = useMemo(() => {
    if (customTip && !isNaN(Number(customTip))) return Number(customTip);
    return (subtotal * selectedTipPercent) / 100;
  }, [subtotal, selectedTipPercent, customTip]);

  const taxAmount = subtotal * 0.05; // 5% GST
  const craveCashDiscount = applyCraveCash ? 12.5 : 0.0;

  const totalAmount = Math.max(
    0,
    subtotal - discount + deliveryFee + platformFee + tipAmount + taxAmount - craveCashDiscount,
  );

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (code === 'SAVOR10' || code === 'EPICUREAN') {
      setVoucherApplied(true);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    let finalOrderNum = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      if (restaurantId && cartItems.length > 0) {
        const primaryUrl =
          process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1/orders';

        let customerId = 'cmvboqiq80004p42mmluqhyvt';
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u.id) customerId = u.id;
          }
        } catch {
          // ignore
        }

        const res = await fetch(primaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            restaurantId,
            items: cartItems.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
            })),
            address: {
              label: selectedAddress.label,
              addressLine: selectedAddress.addressLine,
              city: selectedAddress.city,
              state: selectedAddress.state,
              pincode: selectedAddress.pincode,
              instructions,
            },
          }),
        });

        if (res.ok) {
          const orderData = await res.json();
          if (orderData.orderNumber) {
            finalOrderNum = orderData.orderNumber;
          }
        }
      }
    } catch (err) {
      console.error('Order placement error:', err);
    } finally {
      setTimeout(() => {
        setIsPlacingOrder(false);
        setPlacedOrderNumber(finalOrderNum);
        setOrderSuccess(true);
        clearCart();
      }, 1000);
    }
  };

  return {
    // Cart store
    cartItems,
    restaurantName,
    restaurantId,
    updateQuantity,
    removeItem,
    clearCart,

    // Address
    selectedAddress,
    openAddressModal: openModal,

    // Step 1
    dropoffMode,
    setDropoffMode,
    callboxCode,
    setCallboxCode,
    instructions,
    setInstructions,

    // Step 2
    deliverySpeed,
    setDeliverySpeed,

    // Step 3
    paymentMethod,
    setPaymentMethod,
    applyCraveCash,
    setApplyCraveCash,

    // Step 4
    selectedTipPercent,
    setSelectedTipPercent,
    customTip,
    setCustomTip,
    voucherCode,
    setVoucherCode,
    voucherApplied,
    setVoucherApplied,
    handleApplyVoucher,

    // Pricing
    subtotal,
    discount,
    deliveryFee,
    platformFee,
    tipAmount,
    taxAmount,
    craveCashDiscount,
    totalAmount,

    // Order status
    isPlacingOrder,
    orderSuccess,
    placedOrderNumber,
    handlePlaceOrder,
    dismissConfirmation: () => setOrderSuccess(false),
  };
}
