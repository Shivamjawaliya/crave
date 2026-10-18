'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Flame,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  RotateCcw,
  ChefHat,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import NavbarAuth from '../../components/NavbarAuth';
import AddressModal from '../../components/AddressModal';
import { useCartStore } from '../../lib/store';
import { useAddressStore } from '../../lib/address.store';

interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

interface OrderRestaurant {
  id: string;
  name: string;
  address: string;
  description: string | null;
}

interface OrderAddressSnapshot {
  label?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  instructions?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  customerPhone?: string;
  verificationCode?: string;
  callboxCode?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: string;
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  addressSnapshot: OrderAddressSnapshot;
  createdAt: string;
  items: OrderItem[];
  restaurant: OrderRestaurant;
}

export default function PastOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const { items: cartItems, addItem, getSubtotalPaise } = useCartStore();
  const cartSubtotal = (getSubtotalPaise() / 100).toFixed(2);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const { selectedAddress, openModal, hydrateFromStorage } = useAddressStore();

  const loadOrders = useCallback(async (currentUserId?: string) => {
    try {
      const uId = currentUserId || userId;
      if (!uId) return;

      const rawGateway = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
      const ordersBase = rawGateway.endsWith('/orders') ? rawGateway : `${rawGateway}/orders`;

      const res = await fetch(`${ordersBase}/customer/${uId}`);
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load past orders:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    hydrateFromStorage();
    const stored = localStorage.getItem('user');
    if (!stored) {
      setLoading(false);
      return;
    }
    const user = JSON.parse(stored);
    setUserId(user.id);
    loadOrders(user.id);
  }, [loadOrders]);

  const [sseConnected, setSseConnected] = useState(false);

  // 1-way Scalable Server-Sent Events (SSE) Stream for Millions of Customers
  useEffect(() => {
    if (!userId) return;

    const gatewayUrl =
      process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

    const sseUrl = `${gatewayUrl}/orders/customer/${userId}/live`;
    console.log('⚡ [Customer SSE] Connecting to native SSE stream:', sseUrl);

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('⚡ [Customer SSE] Connected to Live Tracking Stream (SSE)');
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        console.log('⚡ [Customer SSE] Received order update via SSE stream:', data);
        const targetOrderId = data.orderId || data.id;
        const nextStatus = data.newStatus || data.status;

        if (targetOrderId && nextStatus) {
          setOrders((prev) =>
            prev.map((ord) =>
              ord.id === targetOrderId ? { ...ord, status: nextStatus } : ord,
            ),
          );
        }
      } catch (err) {
        console.warn('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      setSseConnected(false);
      console.warn('⚡ [Customer SSE] Reconnecting...', err);
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  // Fallback Gateway WebSocket Listener
  useEffect(() => {
    const gatewaySocketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    const socket: Socket = io(gatewaySocketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('⚡ Customer connected to Gateway WebSocket (fallback)');
      orders.forEach((o) => {
        socket.emit('order:subscribe', { orderId: o.id });
        socket.emit('join_order', { orderId: o.id });
      });
    });

    socket.on('order_status_updated', (data: any) => {
      console.log('⚡ [Customer WS] Real-time order_status_updated:', data);
      const targetOrderId = data.orderId || data.id;
      const nextStatus = data.newStatus || data.status;

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === targetOrderId ? { ...ord, status: nextStatus } : ord,
        ),
      );
    });

    socket.on('order:status', (data: any) => {
      console.log('⚡ [Customer WS] Real-time order:status:', data);
      const targetOrderId = data.orderId || data.id;
      const nextStatus = data.newStatus || data.status;

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === targetOrderId ? { ...ord, status: nextStatus } : ord,
        ),
      );
    });

    const interval = setInterval(() => {
      if (userId) {
        loadOrders(userId);
      }
    }, 6000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [loadOrders, orders, userId]);

  const handleOrderAgain = (order: Order) => {
    if (!order.restaurant || !order.items) return;
    for (const item of order.items) {
      addItem(order.restaurant.id, order.restaurant.name, {
        menuItemId: item.menuItemId,
        name: item.itemName,
        pricePaise: item.unitPricePaise,
      });
    }
    router.push('/cart');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return {
          label: 'Delivered',
          bg: 'bg-emerald-50 text-[#006c49] border-emerald-200',
          dot: 'bg-[#006c49]',
        };
      case 'READY_FOR_PICKUP':
        return {
          label: 'Ready for Pickup',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'PREPARING':
        return {
          label: 'Preparing in Kitchen',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'ACCEPTED':
        return {
          label: 'Order Accepted',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
        return {
          label: 'On the Way',
          bg: 'bg-[#ffdbd1] text-[#ab2f00] border-[#e4beb4]',
          dot: 'bg-[#ab2f00] animate-ping',
        };
      case 'CANCELLED':
      case 'REJECTED':
        return {
          label: 'Cancelled',
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
        };
      default:
        return {
          label: 'Order Confirmed',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
    }
  };

  const getStatusTrackerInfo = (status: string) => {
    switch (status) {
      case 'PLACED':
      case 'PENDING_PAYMENT':
        return {
          text: 'Order placed — awaiting kitchen confirmation',
          step: 1,
        };
      case 'ACCEPTED':
        return {
          text: 'Restaurant is preparing your food',
          step: 2,
        };
      case 'PREPARING':
        return {
          text: 'Restaurant is preparing your food',
          step: 2,
        };
      case 'READY_FOR_PICKUP':
        return {
          text: 'Food prepared & packaged — awaiting courier pickup',
          step: 3,
        };
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return {
          text: 'Courier is on the way to your doorstep 🛵',
          step: 3,
        };
      case 'DELIVERED':
        return {
          text: 'Order delivered! Enjoy your meal 🎉',
          step: 4,
        };
      case 'CANCELLED':
      case 'REJECTED':
        return {
          text: 'Order cancelled',
          step: 0,
        };
      default:
        return {
          text: 'Processing order...',
          step: 1,
        };
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
                <span
                  suppressHydrationWarning
                  className="text-xs font-bold text-[#161c23] truncate max-w-[170px]"
                >
                  {selectedAddress.addressLine} ▾
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cart"
              className="flex items-center gap-2 bg-[#ab2f00] hover:bg-[#8f2700] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md shadow-[#ab2f00]/25 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({totalCartCount}) • ₹{cartSubtotal}</span>
            </Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* 2. PAGE BANNER */}
      <section className="bg-white border-b border-slate-200/80 py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ab2f00] bg-[#ffdbd1] px-3 py-1 rounded-full">
                Account History
              </span>
              {sseConnected && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#006c49] border border-emerald-200 text-[11px] font-extrabold tracking-wider uppercase animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006c49] animate-pulse" />
                  <span>Live Stream Active (SSE)</span>
                </span>
              )}
              <span className="text-xs text-slate-500 font-semibold">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Recorded
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Past Orders & Live Tracking
            </h1>
            <p className="text-xs text-slate-600">
              Review your culinary journeys, live kitchen progression, and reorder with one click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-2xl transition"
            >
              <span>Explore Restaurants</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. ORDERS LIST */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#ab2f00] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Retrieving Order Records from Database...
            </p>
          </div>
        ) : !userId ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">Sign in to view your orders</h2>
              <p className="text-xs text-slate-600">
                Log in to check live kitchen status and view your full order history.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                className="w-full py-3 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-md shadow-[#ab2f00]/25 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-200/80 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">No orders placed yet</h2>
              <p className="text-xs text-slate-600">
                You haven&apos;t placed any orders yet. Explore our curated Michelin and artisan kitchens to start your feast!
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-lg shadow-[#ab2f00]/25 transition"
            >
              <span>Explore Restaurants</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Order Card Header */}
                  <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#ab2f00] shrink-0 mt-0.5">
                        <ChefHat className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-black text-slate-900">
                            {order.restaurant?.name || 'Artisan Kitchen'}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-700">#{order.orderNumber}</span>
                          <span>•</span>
                          <span>{orderDate}</span>
                          {order.restaurant?.address && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[250px]">{order.restaurant.address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOrderAgain(order)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-md shadow-[#ab2f00]/20 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Order Again</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Card Body */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Items list */}
                    <div className="lg:col-span-7 space-y-4">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                        Ordered Items ({order.items.length})
                      </span>

                      <div className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-[#ffdbd1] text-[#ab2f00] font-black text-[11px] flex items-center justify-center shrink-0">
                                {item.quantity}×
                              </span>
                              <span className="font-bold text-slate-900">{item.itemName}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-800">
                              ₹{(item.lineTotalPaise / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery destination card */}
                      <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#ab2f00] shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">
                              {order.addressSnapshot?.label || 'Delivered to'}
                            </span>
                            <span className="text-[10px] text-[#006c49] font-bold bg-[#006c49]/10 px-2 py-0.5 rounded">
                              Confirmed Destination
                            </span>
                          </div>
                          <p className="font-semibold text-slate-700">
                            {order.addressSnapshot?.addressLine || '742 Evergreen Terrace, Apt 4B'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {[order.addressSnapshot?.city, order.addressSnapshot?.state].filter(Boolean).join(', ')}{' '}
                            {order.addressSnapshot?.pincode} • Contact: {order.addressSnapshot?.customerPhone || '+91 98260 12345'}
                          </p>
                        </div>
                      </div>

                      {/* Customer Delivery Handover PIN (OTP) Badge */}
                      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REJECTED' ? (
                        <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">
                                Delivery Verification PIN (OTP)
                              </span>
                              <p className="text-xs text-slate-700 font-medium">
                                Share this PIN with your rider upon arrival:
                              </p>
                            </div>
                          </div>
                          <div className="px-3.5 py-1.5 bg-white border border-amber-300 rounded-xl font-mono font-black text-xl text-amber-900 tracking-widest shadow-sm">
                            {order.addressSnapshot?.deliveryOtp || order.addressSnapshot?.callboxCode?.replace('#', '') || '4192'}
                          </div>
                        </div>
                      ) : order.status === 'DELIVERED' ? (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                          <span className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Package verified & safely delivered
                          </span>
                          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                            PIN: {order.addressSnapshot?.deliveryOtp || order.addressSnapshot?.callboxCode?.replace('#', '') || '4192'}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Right: Payment & Status progression */}
                    <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                        Payment & Bill Breakdown
                      </span>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Items Subtotal</span>
                          <span className="font-mono font-bold">₹{(order.subtotalPaise / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Delivery Fee</span>
                          <span className="font-mono font-bold">
                            {order.deliveryFeePaise === 0 ? (
                              <span className="text-[#006c49]">FREE</span>
                            ) : (
                              `₹${(order.deliveryFeePaise / 100).toFixed(2)}`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Taxes & Platform GST (5%)</span>
                          <span className="font-mono font-bold">₹{(order.taxPaise / 100).toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                          <span>Total Paid</span>
                          <span className="font-mono text-[#ab2f00]">₹{(order.totalPaise / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Live Progression Tracker */}
                      {(() => {
                        const tracker = getStatusTrackerInfo(order.status);
                        return (
                          <div className="pt-3 border-t border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                              <span>Order Status</span>
                              <span className="text-[#ab2f00] font-bold transition-all">
                                {tracker.text}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  tracker.step >= 1 ? 'bg-[#ab2f00]' : 'bg-slate-200'
                                }`}
                                title="Order Placed"
                              ></div>
                              <div
                                className={`h-1.5 rounded-full transition-colors duration-500 ${
                                  tracker.step >= 2 ? 'bg-[#ab2f00]' : 'bg-slate-200'
                                }`}
                                title="Accepted & Preparing"
                              ></div>
                              <div
                                className={`h-1.5 rounded-full transition-colors duration-500 ${
                                  tracker.step >= 3 ? 'bg-[#ab2f00]' : 'bg-slate-200'
                                }`}
                                title="Ready & En Route"
                              ></div>
                              <div
                                className={`h-1.5 rounded-full transition-colors duration-500 ${
                                  tracker.step >= 4 ? 'bg-[#006c49]' : 'bg-slate-200'
                                }`}
                                title="Delivered"
                              ></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Crave Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/cart" className="hover:underline">Cart & Checkout</Link>
              <Link href="/profile" className="hover:underline">My Profile</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
