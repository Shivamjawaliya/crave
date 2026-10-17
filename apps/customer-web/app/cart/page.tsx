'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Lock,
  Clock,
  CreditCard,
  HeartHandshake,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  Flame,
  ShoppingBag,
  Sparkles,
  Check,
  X,
  Phone,
  Star,
} from 'lucide-react';
import NavbarAuth from '../../components/NavbarAuth';
import AddressModal from '../../components/AddressModal';
import { useCartStore } from '../../lib/store';
import { useAddressStore } from '../../lib/address.store';

export default function CartCheckoutPage() {
  const router = useRouter();
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
  const [dropoffMode, setDropoffMode] = useState<'meet' | 'leave'>('leave');
  const [callboxCode, setCallboxCode] = useState('#4192');
  const [instructions, setInstructions] = useState(
    'Please leave package on the bench next to Apt 4B door. Ring bell once.',
  );

  // Step 2: Speed
  const [deliverySpeed, setDeliverySpeed] = useState<'priority' | 'standard' | 'schedule'>(
    'standard',
  );

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay' | 'googlepay'>('card');
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

  // Price calculations
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

  const taxAmount = (subtotal * 0.05); // 5% GST
  const craveCashDiscount = applyCraveCash ? 12.5 : 0.0;

  const totalAmount = Math.max(
    0,
    subtotal - discount + deliveryFee + platformFee + tipAmount + taxAmount - craveCashDiscount,
  );

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherCode.trim().toUpperCase() === 'SAVOR10' || voucherCode.trim().toUpperCase() === 'EPICUREAN') {
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

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#f7f9ff]/95 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.04)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <span className="font-serif font-black text-2xl tracking-tight text-[#161c23]">
                Crave
              </span>
            </Link>

            <button
              type="button"
              onClick={openModal}
              className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 hover:opacity-80 transition text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00] group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Deliver to
                </span>
                <span className="text-xs font-bold text-[#161c23] truncate max-w-[170px]">
                  {selectedAddress.addressLine} ▾
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
            <Link href="/" className="hover:text-[#ab2f00] transition">Offers</Link>
            <Link href="/orders" className="hover:text-[#ab2f00] transition">Past Orders</Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* 2. SUBHEADER: BREADCRUMB & SECURITY STATUS */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#ab2f00] flex items-center gap-1 font-bold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </Link>
            <span>•</span>
            <span className="text-slate-900 font-extrabold">Checkout Flow</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-bold text-[11px] border border-emerald-200">
            <Lock className="w-3 h-3 text-[#006c49]" />
            <span>End-to-End Encrypted Session</span>
          </div>
        </div>
      </div>

      {/* 3. ORDER CONFIRMATION MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-8 text-center space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c49] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#ab2f00] bg-[#ffdbd1] px-3 py-1 rounded-full">
                ORDER CONFIRMED
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Kitchen is preparing your feast!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Your order <strong className="text-slate-900 font-mono">#{placedOrderNumber}</strong> has been transmitted to the executive kitchen line.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Estimated Arrival</span>
                <span className="font-extrabold text-[#006c49]">20–30 mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Delivery Address</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {selectedAddress.addressLine}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Mode</span>
                <span className="font-bold text-slate-800">Visa ending in 4242</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/orders"
                className="w-full py-3.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ab2f00]/30 transition"
              >
                <span>Track Live Delivery</span>
                <span>→</span>
              </Link>
              <Link
                href="/"
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN CHECKOUT GRID */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: 4 Stepped Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Delivery Address & Drop-off */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Delivery Address & Drop-off
                  </h3>
                  <span className="text-xs text-slate-500">Confirmed delivery destination</span>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="text-xs font-bold text-[#ab2f00] hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Address Box */}
            <div
              onClick={openModal}
              className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:border-[#ab2f00]/50 transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#ab2f00] shrink-0 mt-0.5 group-hover:bg-[#ffdbd1] transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900">
                    {selectedAddress.label || 'Home'}
                  </span>
                  {selectedAddress.isDefault && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 font-semibold pt-0.5">
                  {selectedAddress.addressLine}
                </p>
                <p className="text-[11px] text-slate-500">
                  {[selectedAddress.city, selectedAddress.state].filter(Boolean).join(', ')} {selectedAddress.pincode} • Intercom available
                </p>
              </div>
            </div>

            {/* Drop-off Preference */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-900 block">
                Drop-off Preference
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDropoffMode('meet')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    dropoffMode === 'meet'
                      ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>👤 Meet at door</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDropoffMode('leave')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    dropoffMode === 'leave'
                      ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🚪 Leave at door</span>
                </button>
              </div>

              {/* Callbox Code & Instructions */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="font-bold">Building callbox code:</span>
                  <input
                    type="text"
                    value={callboxCode}
                    onChange={(e) => setCallboxCode(e.target.value)}
                    className="w-20 bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[#ab2f00] font-bold"
                  />
                </div>

                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions for courier..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#ab2f00] outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Delivery Speed & Schedule */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delivery Speed & Schedule
                </h3>
                <span className="text-xs text-slate-500">Paced for optimal culinary temperature</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Priority */}
              <div
                onClick={() => setDeliverySpeed('priority')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  deliverySpeed === 'priority'
                    ? 'border-[#ab2f00] bg-[#fff5f2]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-lg">⚡</span>
                  <span className="text-[10px] font-bold text-[#ab2f00] bg-[#ffdbd1] px-2 py-0.5 rounded-full">
                    +$2.99
                  </span>
                </div>
                <div className="pt-3">
                  <strong className="text-xs font-black block text-slate-900">Priority</strong>
                  <span className="text-[11px] text-slate-600 block">15–25 mins</span>
                  <span className="text-[10px] text-[#ab2f00] font-bold block pt-1">Direct to door</span>
                </div>
              </div>

              {/* Standard */}
              <div
                onClick={() => setDeliverySpeed('standard')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  deliverySpeed === 'standard'
                    ? 'border-[#ab2f00] bg-[#fff5f2]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-lg">⏱️</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </div>
                <div className="pt-3">
                  <strong className="text-xs font-black block text-slate-900">Standard</strong>
                  <span className="text-[11px] text-slate-600 block">25–35 mins</span>
                  <span className="text-[10px] text-[#006c49] font-bold block pt-1">Popular</span>
                </div>
              </div>

              {/* Schedule */}
              <div
                onClick={() => setDeliverySpeed('schedule')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  deliverySpeed === 'schedule'
                    ? 'border-[#ab2f00] bg-[#fff5f2]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-lg">📅</span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    Free
                  </span>
                </div>
                <div className="pt-3">
                  <strong className="text-xs font-black block text-slate-900">Schedule</strong>
                  <span className="text-[11px] text-slate-600 block">Choose time slot</span>
                  <span className="text-[10px] text-slate-500 font-medium block pt-1">Plan ahead</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Payment Method */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Payment Method</h3>
                  <span className="text-xs text-slate-500">Select express checkout or cards</span>
                </div>
              </div>

              <button className="text-xs font-bold text-[#ab2f00] hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>

            {/* Express Pay Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('applepay')}
                className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition ${
                  paymentMethod === 'applepay'
                    ? 'bg-black text-white border-black'
                    : 'bg-slate-900 text-white hover:bg-black'
                }`}
              >
                <span> Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('googlepay')}
                className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition ${
                  paymentMethod === 'googlepay'
                    ? 'bg-slate-100 border-slate-400 text-slate-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>G Pay</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                OR PAY WITH CARD
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Saved Card Option */}
            <div
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                paymentMethod === 'card'
                  ? 'border-[#006c49] bg-emerald-50/40'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-[#1a1f71] text-white flex items-center justify-center font-bold text-[10px] tracking-wider">
                  VISA
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">Visa ending in 4242</span>
                    <span className="text-[10px] bg-emerald-100 text-[#006c49] font-bold px-2 py-0.5 rounded">
                      Primary
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Expires 09/27 • Verified by Visa
                  </span>
                </div>
              </div>

              <div className="w-5 h-5 rounded-full bg-[#006c49] text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            </div>

            {/* Crave Cash Switcher */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-bold text-xs">
                  C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs text-slate-900">Apply Crave Cash</strong>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold">
                      $12.50 available
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Automatically offset your total
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={applyCraveCash}
                onChange={(e) => setApplyCraveCash(e.target.checked)}
                className="w-5 h-5 rounded text-[#ab2f00] focus:ring-[#ab2f00]"
              />
            </div>
          </div>

          {/* STEP 4: Courier Tip */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Courier Tip</h3>
                  <span className="text-xs text-slate-500">Support your dedicated driver</span>
                </div>
              </div>

              <span className="text-xs font-bold text-[#ab2f00] flex items-center gap-1">
                <HeartHandshake className="w-4 h-4" />
                <span>100% directly to courier</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[15, 18, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setSelectedTipPercent(pct);
                    setCustomTip('');
                  }}
                  className={`py-3 rounded-2xl border text-center transition ${
                    selectedTipPercent === pct && !customTip
                      ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <strong className="text-xs block font-black">{pct}%</strong>
                  <span className="text-[11px] block opacity-90">
                    ${((subtotal * pct) / 100).toFixed(2)}
                  </span>
                </button>
              ))}

              <div
                className={`py-2 px-3 rounded-2xl border flex flex-col justify-center text-center ${
                  customTip ? 'border-[#ab2f00] bg-[#fff5f2]' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase">Custom</span>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="$0.00"
                  className="w-full text-center text-xs font-bold outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* OFFERS & VOUCHERS PANEL */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Offers & Vouchers</h3>

            <form onSubmit={handleApplyVoucher} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Enter coupon or gift card code (try SAVOR10)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#ab2f00] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Apply
              </button>
            </form>

            {voucherApplied && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006c49]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#006c49]" />
                  <span>SAVOR10 applied — $5.00 off order</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoucherApplied(false)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl space-y-6">
            {/* Restaurant Badge */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center font-serif font-black text-xl shrink-0">
                U
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {restaurantName || 'Umai Handcrafted Ramen'}
                  </h4>
                  <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Artisan
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> 4.9
                  </span>
                  <span>• (503) 555-8291</span>
                </div>
              </div>
            </div>

            {/* Itemized Order List */}
            <div className="space-y-4 max-h-72 overflow-y-auto no-scrollbar">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.menuItemId} className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#ab2f00]">{item.quantity}x</span>
                        <h5 className="font-bold text-slate-900 truncate">{item.name}</h5>
                      </div>
                      <span className="text-slate-500 text-[11px] block">
                        Prepared fresh upon placement
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-900">
                        ${((item.pricePaise * item.quantity) / 100).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Default Preview Items matching Stitch Screenshot */
                <>
                  <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#ab2f00]">1x</span>
                        <h5 className="font-bold text-slate-900">Black Garlic Truffle Tonkotsu</h5>
                      </div>
                      <span className="text-slate-500 text-[11px]">Firm noodles, Extra Tamago, Spicy Chili Crunch</span>
                    </div>
                    <span className="font-extrabold text-slate-900">$22.25</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#ab2f00]">1x</span>
                        <h5 className="font-bold text-slate-900">Pan-Seared Wagyu Gyoza</h5>
                      </div>
                      <span className="text-slate-500 text-[11px]">6 pcs, scallion soy dipping glaze</span>
                    </div>
                    <span className="font-extrabold text-slate-900">$11.00</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#ab2f00]">1x</span>
                        <h5 className="font-bold text-slate-900">Yuzu Sparkling Soda</h5>
                      </div>
                      <span className="text-slate-500 text-[11px]">Chilled, organic cane sugar</span>
                    </div>
                    <span className="font-extrabold text-slate-900">$4.50</span>
                  </div>
                </>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length > 0 ? cartItems.length : 3} items)</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>

              {voucherApplied && (
                <div className="flex justify-between text-[#006c49] font-bold">
                  <span>SAVOR10 Promo</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-900">${deliveryFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Service & Platform Fee</span>
                <span className="font-bold text-slate-900">${platformFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Courier Tip ({selectedTipPercent}%)</span>
                <span className="font-bold text-slate-900">${tipAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Taxes (5%)</span>
                <span className="font-bold text-slate-900">${taxAmount.toFixed(2)}</span>
              </div>

              {applyCraveCash && (
                <div className="flex justify-between text-[#ab2f00] font-bold">
                  <span>Crave Cash Applied</span>
                  <span>-${craveCashDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                <div>
                  <span className="block leading-none">Total</span>
                  <span className="text-[10px] font-normal text-slate-400 block pt-1">
                    Includes all fees & tip
                  </span>
                </div>
                <span className="text-2xl font-black text-[#ab2f00]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order Primary Action */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full py-4 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ab2f00]/30 transition disabled:opacity-50"
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Transmitting to Kitchen...</span>
                </>
              ) : (
                <>
                  <span>Place Order • ${totalAmount.toFixed(2)}</span>
                  <span>→</span>
                </>
              )}
            </button>

            {/* Trust badge */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold text-center">
              <ShieldCheck className="w-4 h-4 text-[#006c49]" />
              <span>Guaranteed Safe Checkout • 256-bit SSL Bank-Grade Encryption</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-[11px] text-slate-700">
              <Sparkles className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
              <span>
                <strong>Fresh-Pack Guarantee:</strong> Noodles & broth separated for guaranteed thermal texture integrity.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 5. CRAVE FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Crave Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/orders" className="hover:underline">Past Orders</Link>
              <Link href="/login" className="hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Address Management Modal */}
      <AddressModal />
    </div>
  );
}
