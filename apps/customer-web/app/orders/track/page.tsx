'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Share2,
  Bell,
  Clock,
  Check,
  CheckCircle2,
  Bike,
  Phone,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Flame,
  MapPin,
  Utensils,
  ExternalLink,
  Copy,
  Receipt,
  RotateCcw,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import NavbarAuth from '../../../components/NavbarAuth';
import AddressModal from '../../../components/AddressModal';
import { useOrderStore, ActiveOrder, DEFAULT_ACTIVE_ORDER } from '../../../lib/order.store';
import { useAddressStore } from '../../../lib/address.store';

// Client-only dynamic Leaflet Map
const LiveOrderTrackingMap = dynamic(
  () => import('../../../components/LiveOrderTrackingMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3 border border-slate-200">
        <div className="w-8 h-8 border-3 border-[#ab2f00] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-600">Connecting Satellite GPS Feed...</span>
      </div>
    ),
  }
);

function mapBackendOrderToActiveOrder(backendOrder: any): ActiveOrder {
  const statusLogs = backendOrder.statusLogs || [];
  const placedLog = statusLogs.find((l: any) => l.status === 'PLACED');
  const preppedLog = statusLogs.find(
    (l: any) => l.status === 'PREPARING' || l.status === 'READY_FOR_PICKUP'
  );
  const deliveredLog = statusLogs.find((l: any) => l.status === 'DELIVERED');

  const formatLogTime = (isoString?: string) => {
    if (!isoString) return undefined;
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return undefined;
    }
  };

  const placedAt = formatLogTime(placedLog?.createdAt || backendOrder.createdAt) || '7:18 PM';
  const preppedAt = formatLogTime(preppedLog?.createdAt);
  const deliveredAt = formatLogTime(deliveredLog?.createdAt || backendOrder.delivery?.deliveredAt);

  let uiStatus: ActiveOrder['status'] = 'PLACED';
  const rawStatus = (backendOrder.status || '').toUpperCase();

  if (rawStatus === 'DELIVERED') {
    uiStatus = 'DELIVERED';
  } else if (
    rawStatus === 'OUT_FOR_DELIVERY' ||
    rawStatus === 'PICKED_UP' ||
    rawStatus === 'READY_FOR_PICKUP' ||
    rawStatus === 'IN_TRANSIT' ||
    rawStatus === 'ARRIVED_AT_CUSTOMER'
  ) {
    uiStatus = 'ON_THE_WAY';
  } else if (rawStatus === 'PREPARING' || rawStatus === 'ACCEPTED') {
    uiStatus = 'PREPARING';
  } else {
    uiStatus = 'PLACED';
  }

  const addr = backendOrder.addressSnapshot || {};

  return {
    id: backendOrder.id,
    orderNumber: backendOrder.orderNumber,
    restaurantId: backendOrder.restaurantId || 'rest-1',
    restaurantName: backendOrder.restaurant?.name || 'Restaurant',
    restaurantAddress: backendOrder.restaurant?.address || undefined,
    status: uiStatus,
    statusText:
      uiStatus === 'DELIVERED'
        ? 'Delivered Safely 🎉'
        : uiStatus === 'ON_THE_WAY'
        ? 'On The Way (En Route)'
        : uiStatus === 'PREPARING'
        ? 'Kitchen Prepping Your Feast'
        : 'Order Placed • Waiting for Kitchen',
    etaMinutes:
      uiStatus === 'DELIVERED' ? 'Delivered' : uiStatus === 'ON_THE_WAY' ? '12–15 min' : '25–30 min',
    etaTime:
      deliveredAt ||
      (backendOrder.delivery?.deliveredAt
        ? formatLogTime(backendOrder.delivery.deliveredAt)!
        : '7:42 PM'),
    driverDistance: uiStatus === 'DELIVERED' ? 'Delivered at Doorstep' : '1.2 miles away',
    placedAt,
    preppedAt:
      preppedAt ||
      (uiStatus === 'PREPARING' || uiStatus === 'ON_THE_WAY' || uiStatus === 'DELIVERED'
        ? placedAt
        : undefined),
    deliveredAt,
    items: (backendOrder.items || []).map((it: any) => ({
      name: it.itemName || it.name,
      quantity: it.quantity,
      pricePaise: it.unitPricePaise || it.pricePaise || 0,
      subtitle: it.subtitle,
      imageUrl: it.imageUrl,
    })),
    subtotalPaise: backendOrder.subtotalPaise || 0,
    deliveryFeePaise: backendOrder.deliveryFeePaise || 0,
    taxPaise: backendOrder.taxPaise || 0,
    tipPaise: 0,
    totalPaise: backendOrder.totalPaise || 0,
    deliveryAddress: {
      label: addr.label || 'Home',
      addressLine: addr.addressLine || 'Home Delivery',
      city: addr.city || 'Bhopal',
      instructions: addr.instructions || 'Contactless Drop-off Requested.',
      deliveryOtp: addr.deliveryOtp || addr.callboxCode?.replace('#', '') || '3497',
    },
    courier: {
      name: backendOrder.delivery?.partner?.name || 'Marcus Chen',
      phone: backendOrder.delivery?.partner?.phone || '+91 98260 12345',
      vehicle: backendOrder.delivery?.partner?.vehicleNumber || 'Silver Honda Civic • 7XYZ99',
      rating: '4.98',
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      note: 'Picked up your order! In thermal bag, see you shortly.',
    },
  };
}

export default function LiveOrderTrackingPage() {
  const { activeOrder, setActiveOrder, hydrateFromStorage } = useOrderStore();
  const { selectedAddress, openModal, hydrateFromStorage: hydrateAddress } = useAddressStore();

  const [liveOrder, setLiveOrder] = useState<ActiveOrder | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'courier' | 'user'; text: string; time: string }>>([
    {
      sender: 'courier',
      text: 'Picked up your order from the restaurant! In thermal bag, see you shortly.',
      time: '7:31 PM',
    },
  ]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Live status update from socket or SSE
  const handleStatusUpdate = (newStatus: string) => {
    console.log('⚡ [LiveOrderTrackingPage] Received live status update:', newStatus);
    const upper = newStatus.toUpperCase();
    let mappedUiStatus: ActiveOrder['status'] = 'PLACED';
    if (upper === 'DELIVERED') {
      mappedUiStatus = 'DELIVERED';
    } else if (
      upper === 'OUT_FOR_DELIVERY' ||
      upper === 'PICKED_UP' ||
      upper === 'READY_FOR_PICKUP' ||
      upper === 'IN_TRANSIT' ||
      upper === 'ARRIVED_AT_CUSTOMER'
    ) {
      mappedUiStatus = 'ON_THE_WAY';
    } else if (upper === 'PREPARING' || upper === 'ACCEPTED') {
      mappedUiStatus = 'PREPARING';
    }

    setLiveOrder((prev) => {
      const current = prev || activeOrder || DEFAULT_ACTIVE_ORDER;
      const nowStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const updated: ActiveOrder = {
        ...current,
        status: mappedUiStatus,
        statusText:
          mappedUiStatus === 'DELIVERED'
            ? 'Delivered Safely 🎉'
            : mappedUiStatus === 'ON_THE_WAY'
            ? 'On The Way (En Route)'
            : mappedUiStatus === 'PREPARING'
            ? 'Kitchen Prepping Your Feast'
            : 'Order Placed • Waiting for Kitchen',
        etaMinutes: mappedUiStatus === 'DELIVERED' ? 'Delivered' : current.etaMinutes,
        driverDistance:
          mappedUiStatus === 'DELIVERED' ? 'Delivered at Doorstep' : current.driverDistance,
        deliveredAt:
          mappedUiStatus === 'DELIVERED' ? current.deliveredAt || nowStr : current.deliveredAt,
      };
      setActiveOrder(updated);
      return updated;
    });
  };

  useEffect(() => {
    hydrateFromStorage();
    hydrateAddress();

    let isMounted = true;
    const apiBase = (
      process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1'
    ).replace(/\/+$/, '');

    const fetchLatestOrderStatus = async () => {
      try {
        let orderIdParam: string | null = null;
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          orderIdParam = params.get('orderId') || params.get('id') || params.get('orderNumber');
        }

        let customerId: string | null = null;
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const u = JSON.parse(storedUser);
              if (u.id) customerId = u.id;
            } catch {}
          }
        }

        let targetId = orderIdParam;
        if (!targetId) {
          const storedOrder = localStorage.getItem('crave_active_order');
          if (storedOrder) {
            try {
              const parsed = JSON.parse(storedOrder);
              if (parsed.id && !parsed.id.startsWith('order-umai')) {
                targetId = parsed.id;
              }
            } catch {}
          }
        }

        let fetchedOrderData: any = null;

        // 1. If targetId exists, fetch specific order
        if (targetId) {
          const cleanId = targetId.startsWith('order-') ? targetId.replace('order-', '') : targetId;
          let res = await fetch(`${apiBase}/orders/${targetId}`);
          if (!res.ok && cleanId !== targetId) {
            res = await fetch(`${apiBase}/orders/${cleanId}`);
          }
          if (res.ok) {
            fetchedOrderData = await res.json();
          }
        }

        // 2. If not found by targetId, fetch customer's most recent order
        if (!fetchedOrderData && customerId) {
          const res = await fetch(`${apiBase}/orders/customer/${customerId}`);
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              fetchedOrderData = list[0];
            }
          }
        }

        // 3. Fallback for development if customerId was empty
        if (!fetchedOrderData) {
          const fallbackCustomerId = 'cmveg86f80006p4599djho19f';
          const res = await fetch(`${apiBase}/orders/customer/${fallbackCustomerId}`);
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              fetchedOrderData = list[0];
            }
          }
        }

        if (fetchedOrderData && isMounted) {
          console.log(
            '✅ [LiveOrderTrackingPage] Loaded order from DB:',
            fetchedOrderData.id,
            fetchedOrderData.status
          );
          const mapped = mapBackendOrderToActiveOrder(fetchedOrderData);
          setLiveOrder(mapped);
          setActiveOrder(mapped);
        }
      } catch (err) {
        console.warn('LiveOrderTrackingPage fetch failed:', err);
      }
    };

    fetchLatestOrderStatus();

    // SSE real-time stream subscription for the customer
    let eventSource: EventSource | null = null;
    let storedUser: any = null;
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('user');
        if (u) storedUser = JSON.parse(u);
      } catch {}
    }

    if (storedUser?.id) {
      try {
        const sseUrl = `${apiBase}/orders/customer/${storedUser.id}/live`;
        eventSource = new EventSource(sseUrl);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') return;
            const nextStatus = data.newStatus || data.status;
            if (nextStatus) {
              handleStatusUpdate(nextStatus);
            }
          } catch {}
        };
      } catch {}
    }

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, [hydrateFromStorage, hydrateAddress, setActiveOrder]);

  const order = liveOrder || activeOrder || DEFAULT_ACTIVE_ORDER;
  const status = order.status;

  const currentStep =
    status === 'PLACED' ? 0 : status === 'PREPARING' ? 1 : status === 'ON_THE_WAY' ? 2 : 3;

  const progressWidth =
    currentStep === 0 ? '12%' : currentStep === 1 ? '38%' : currentStep === 2 ? '70%' : '100%';

  const desktopTitle =
    currentStep === 0
      ? 'Order Placed'
      : currentStep === 1
      ? 'Prepping Your Feast'
      : currentStep === 2
      ? `Arriving in ${order.etaMinutes}`
      : 'Order Delivered! 🎉';

  const desktopSubtitle =
    currentStep === 0
      ? 'Awaiting kitchen confirmation'
      : currentStep === 1
      ? 'Chef handcrafted preparation'
      : currentStep === 2
      ? `~ ${order.etaTime} Drop-off`
      : `Delivered at ${order.deliveredAt || order.etaTime}`;

  const mobileTitle =
    currentStep === 0
      ? 'Order Placed'
      : currentStep === 1
      ? 'Prepping Order'
      : currentStep === 2
      ? `Arriving in ${order.etaMinutes}`
      : 'Order Delivered! 🎉';

  const mobileSubtitle =
    currentStep === 0
      ? 'Kitchen is confirming your order'
      : currentStep === 1
      ? 'Chef is cooking your handcrafted dishes'
      : currentStep === 2
      ? `Estimated drop-off at ${order.etaTime}`
      : `Enjoy your meal from ${order.restaurantName}`;

  const telemetry = {
    icon: currentStep === 3 ? CheckCircle2 : currentStep === 2 ? Bike : currentStep === 1 ? Utensils : Clock,
    label:
      currentStep === 3
        ? 'Status'
        : currentStep === 2
        ? 'Courier Distance'
        : currentStep === 1
        ? 'Kitchen Status'
        : 'Order State',
    value:
      currentStep === 3
        ? 'Delivered at Door'
        : currentStep === 2
        ? order.driverDistance
        : currentStep === 1
        ? 'Preparing in Kitchen'
        : 'Order Received',
  };

  const steps = [
    {
      index: 0,
      labelDesktop: 'Placed',
      labelMobile: 'Placed',
      timeDesktop: order.placedAt || '7:18 PM',
      timeMobile: order.placedAt || '7:18 PM',
      isCompleted: currentStep > 0,
      isActive: currentStep === 0,
      renderActiveIcon: (cls: string) => <Check className={`${cls} stroke-[3]`} />,
      renderPendingIcon: (cls: string) => <Receipt className={cls} />,
    },
    {
      index: 1,
      labelDesktop: 'Kitchen Prepped',
      labelMobile: 'Prepped',
      timeDesktop: currentStep >= 1 ? order.preppedAt || '7:29 PM' : 'Est. ~10 min',
      timeMobile: currentStep >= 1 ? order.preppedAt || '7:29 PM' : 'Est. ~10 min',
      isCompleted: currentStep > 1,
      isActive: currentStep === 1,
      renderActiveIcon: (cls: string) => <Utensils className={cls} />,
      renderPendingIcon: (cls: string) => <Utensils className={cls} />,
    },
    {
      index: 2,
      labelDesktop: 'On The Way',
      labelMobile: 'On The Way',
      timeDesktop:
        currentStep === 2
          ? `En Route (${order.courier.name.split(' ')[0]})`
          : currentStep > 2
          ? 'Completed'
          : 'Est. ~18 min',
      timeMobile:
        currentStep === 2
          ? 'In route'
          : currentStep > 2
          ? 'Delivered'
          : 'Est. ~18 min',
      isCompleted: currentStep > 2,
      isActive: currentStep === 2,
      renderActiveIcon: (cls: string) => <Bike className={cls} />,
      renderPendingIcon: (cls: string) => <Bike className={cls} />,
    },
    {
      index: 3,
      labelDesktop: 'Delivered',
      labelMobile: 'Delivered',
      timeDesktop:
        currentStep === 3
          ? order.deliveredAt || order.etaTime
          : `Est. ${order.etaTime}`,
      timeMobile:
        currentStep === 3
          ? order.deliveredAt || order.etaTime
          : `Approx ${order.etaTime}`,
      isCompleted: currentStep === 3,
      isActive: currentStep === 3,
      renderActiveIcon: (cls: string) => <Check className={`${cls} stroke-[3]`} />,
      renderPendingIcon: (cls: string) => <MapPin className={cls} />,
    },
  ];

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: messageText.trim(), time: timeStr }]);
    setMessageText('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'courier',
          text: 'Got it! Taking the quickest turn around the avenue.',
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* ========================================================= */}
      {/* 1. DESKTOP VIEW (Stitch Screen d6b10a33068f46c7acb873ca306771cb) */}
      {/* ========================================================= */}
      <div className="hidden md:flex md:flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-[#f7f9ff]/90 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.06)]">
          <div className="h-20 w-full max-w-[1400px] mx-auto px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <span className="font-serif font-black text-2xl tracking-tight text-[#161c23]">
                  Crave
                </span>
              </Link>

              {/* Deliver To Selector */}
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Deliver to
                  </span>
                  <button
                    type="button"
                    onClick={openModal}
                    className="flex items-center gap-1 text-xs font-bold text-[#161c23] hover:text-[#ab2f00] transition cursor-pointer"
                  >
                    <span suppressHydrationWarning className="truncate max-w-[180px]">
                      {selectedAddress.addressLine}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/orders"
                className="text-xs font-bold text-slate-700 hover:text-[#ab2f00] transition"
              >
                Past Orders
              </Link>
              <NavbarAuth />
            </div>
          </div>
        </header>

        {/* Desktop Main Container */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-8 py-8 space-y-8">
          {/* Top Status Header Banner */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-extrabold flex items-center gap-1.5 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE GPS ACTIVE
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Order <strong className="text-slate-900 font-mono">#{order.orderNumber}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-700">{order.restaurantName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Placed at {order.placedAt || '7:18 PM'}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-[#006c49]" />
                  SMS Alerts: <strong className="text-[#006c49]">On</strong>
                </span>
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
                </button>
              </div>
            </div>

            {/* Arrival Estimation & Telemetry Row */}
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    On Schedule
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    Safe Thermal Transport Active
                  </span>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                    {desktopTitle}
                  </h1>
                  <span className="text-base font-bold text-[#ab2f00]">
                    {desktopSubtitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#ab2f00]/10 text-[#ab2f00] flex items-center justify-center">
                  <telemetry.icon className="w-5 h-5 text-[#ab2f00]" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">{telemetry.label}</span>
                  <strong className="text-sm font-extrabold text-slate-900">{telemetry.value}</strong>
                </div>
              </div>
            </div>

            {/* 4-Stage Live Progress Stepper */}
            <div className="pt-2">
              <div className="grid grid-cols-4 gap-2 relative">
                <div className="absolute top-4 left-6 right-6 h-1 bg-slate-100 rounded-full -z-0">
                  <div
                    className="h-full bg-[#006c49] rounded-full transition-all duration-700 ease-out"
                    style={{ width: progressWidth }}
                  />
                </div>

                {steps.map((s) => {
                  const isCompleted = s.isCompleted;
                  const isActive = s.isActive;
                  const isDeliveredActive = s.index === 3 && isActive;

                  return (
                    <div key={s.index} className="flex flex-col items-center text-center z-10 transition-all duration-300">
                      {isCompleted ? (
                        <div
                          className={`w-8 h-8 rounded-full ${
                            isDeliveredActive ? 'bg-[#006c49] ring-4 ring-emerald-200' : 'bg-[#006c49]'
                          } text-white flex items-center justify-center shadow-md mb-2`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : isActive ? (
                        <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center ring-4 ring-[#ffdbd1] shadow-lg mb-2 animate-bounce">
                          {s.renderActiveIcon('w-4 h-4')}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                          {s.renderPendingIcon('w-4 h-4')}
                        </div>
                      )}

                      <span
                        className={`text-xs transition-colors duration-200 ${
                          isActive
                            ? isDeliveredActive
                              ? 'font-extrabold text-[#006c49]'
                              : 'font-extrabold text-[#ab2f00]'
                            : isCompleted
                            ? 'font-bold text-slate-900'
                            : 'font-medium text-slate-500'
                        }`}
                      >
                        {s.labelDesktop}
                      </span>
                      <span
                        className={`text-[10px] transition-colors duration-200 ${
                          isActive
                            ? isDeliveredActive
                              ? 'text-[#006c49] font-bold'
                              : 'text-slate-600 font-semibold'
                            : isCompleted
                            ? 'text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.timeDesktop}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Live Status Footer (Read-Only) */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      order.status === 'DELIVERED'
                        ? 'bg-[#006c49]'
                        : 'bg-emerald-500 animate-ping'
                    }`}
                  />
                  <span className="font-extrabold text-slate-800">
                    {order.status === 'DELIVERED'
                      ? 'Order Completed Safely'
                      : 'Live Satellite Telemetry Synced'}
                  </span>
                  <span className="text-slate-400">• Order #{order.orderNumber}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {order.status === 'DELIVERED'
                    ? 'Thank you for ordering with Crave!'
                    : 'Synced directly with delivery partner GPS'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Vector Live Map & Delivery Instructions */}
            <div className="lg:col-span-8 space-y-6">
              {/* Map Container */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="h-[440px] w-full rounded-2xl overflow-hidden relative">
                  <LiveOrderTrackingMap
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    orderStatus={order.status}
                    restaurant={{
                      name: order.restaurantName,
                      address: order.restaurantAddress,
                      latitude: 23.2599,
                      longitude: 77.4126,
                    }}
                    customerAddress={{
                      addressLine: order.deliveryAddress.addressLine,
                      latitude: 23.2450,
                      longitude: 77.4320,
                    }}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>

              {/* Delivery Destination Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006c49] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">
                      Delivery Destination
                    </span>
                  </div>
                  <span className="text-[11px] text-[#006c49] font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Confirmed GPS Drop-off
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Address
                    </span>
                    <strong className="text-slate-900 text-sm block">
                      {order.deliveryAddress.addressLine}
                    </strong>
                    <p className="text-slate-500">{order.deliveryAddress.city}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Drop-off Preference
                    </span>
                    <strong className="text-slate-900 block">
                      Contactless Drop-off Requested
                    </strong>
                    <p className="text-slate-500 leading-relaxed">
                      {order.deliveryAddress.instructions}
                    </p>
                  </div>
                </div>

                {/* Delivery Verification PIN */}
                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">
                        Delivery Verification PIN (OTP)
                      </span>
                      <p className="text-xs text-slate-700 font-medium">
                        Share this PIN with {order.courier.name.split(' ')[0]} upon arrival:
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-white border border-amber-300 rounded-xl font-mono font-black text-xl text-amber-900 tracking-widest shadow-sm">
                    {order.deliveryAddress.deliveryOtp || '4192'}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Courier Info & Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              {/* Courier Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    YOUR CRAVE COURIER
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006c49] text-[10px] font-black uppercase">
                    Crave Pro
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={order.courier.photoUrl}
                      alt={order.courier.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {order.courier.name}
                      </h4>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                        ★ {order.courier.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{order.courier.vehicle}</p>
                    <span className="text-[10px] text-slate-400">Completed 1,840+ fresh drop-offs</span>
                  </div>
                </div>

                {/* Courier Note Bubble */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic">
                  "{order.courier.note}"
                </div>

                {/* Courier Actions */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCallModalOpen(true)}
                    className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call {order.courier.name.split(' ')[0]}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageModalOpen(true)}
                    className="py-2.5 px-3 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#ab2f00]/20 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>Message</span>
                  </button>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    ORDER SUMMARY ({order.items.length} items)
                  </span>
                  <span className="text-xs font-black text-[#ab2f00]">
                    ${(order.totalPaise / 100).toFixed(2)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-start gap-3 text-xs">
                      {item.imageUrl && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-slate-900 truncate">
                            {item.quantity}x {item.name}
                          </h5>
                          <span className="font-bold text-slate-800 shrink-0">
                            ${((item.pricePaise * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 pt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal &amp; Taxes</span>
                    <span className="font-bold text-slate-900">${(order.subtotalPaise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Delivery</span>
                    <span className="font-bold text-[#006c49]">FREE (Crave+)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courier Gratuity</span>
                    <span className="font-bold text-slate-900">${(order.tipPaise / 100).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Paid</span>
                    <span className="text-[#ab2f00]">${(order.totalPaise / 100).toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block pt-0.5">Paid via Apple Pay</span>
                </div>
              </div>

              {/* Need Assistance? Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => alert('Support representative connected on chat!')}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between shadow-sm transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#ab2f00]" />
                    <span>Need Help with this Order?</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between shadow-sm transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-600" />
                    <span>Download Itemized PDF Receipt</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200/80 py-8 mt-16 text-center text-xs text-slate-500">
          <span>© 2026 Crave Technologies Inc. All rights reserved. • Live Satellite Order Telemetry</span>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* 2. MOBILE VIEW (Stitch Screen 1c1b955442364c048d42ebd918493fce) */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col min-h-screen bg-[#f7f9ff]">
        {/* Mobile App Bar */}
        <header className="sticky top-0 z-40 bg-[#f7f9ff]/95 backdrop-blur-xl border-b border-[#e4beb4]/30 px-3 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Live Order Tracking
          </h2>

          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ab2f00] to-[#e64000] text-white flex items-center justify-center font-bold text-xs shadow-sm"
          >
            U
          </Link>
        </header>

        {/* Mobile Full GPS Map Canvas */}
        <div className="relative w-full h-[320px] bg-slate-100 overflow-hidden">
          <LiveOrderTrackingMap
            orderId={order.id}
            orderNumber={order.orderNumber}
            orderStatus={order.status}
            restaurant={{
              name: order.restaurantName,
              address: order.restaurantAddress,
              latitude: 23.2599,
              longitude: 77.4126,
            }}
            customerAddress={{
              addressLine: order.deliveryAddress.addressLine,
              latitude: 23.2450,
              longitude: 77.4320,
            }}
            onStatusUpdate={handleStatusUpdate}
          />

          {/* Top GPS Active Overlay Pill */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-800">
                Order #{order.orderNumber}
              </span>
            </div>

            <button
              type="button"
              onClick={handleShareLink}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-slate-700 pointer-events-auto active:scale-95 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Pull-up Sheet */}
        <div className="flex-1 bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-4 pt-3 pb-8 -mt-6 relative z-20 space-y-4">
          {/* Sheet Handle */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />

          {/* Primary ETA Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {mobileTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mobileSubtitle}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
          </div>

          {/* 4-Stage Micro Tracker */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-4 relative gap-1">
              <div className="absolute top-3.5 left-4 right-4 h-1 bg-slate-200 rounded-full -z-0">
                <div
                  className="h-full bg-[#006c49] rounded-full transition-all duration-700 ease-out"
                  style={{ width: progressWidth }}
                />
              </div>

              {steps.map((s) => {
                const isCompleted = s.isCompleted;
                const isActive = s.isActive;
                const isDeliveredActive = s.index === 3 && isActive;

                return (
                  <div key={s.index} className="flex flex-col items-center text-center z-10 transition-all duration-300">
                    {isCompleted ? (
                      <div
                        className={`w-7 h-7 rounded-full ${
                          isDeliveredActive ? 'bg-[#006c49] ring-2 ring-emerald-200' : 'bg-[#006c49]'
                        } text-white flex items-center justify-center shadow-sm mb-1`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : isActive ? (
                      <div className="w-7 h-7 rounded-full bg-[#ab2f00] text-white flex items-center justify-center ring-2 ring-[#ffdbd1] shadow-md mb-1 animate-pulse">
                        {s.renderActiveIcon('w-3.5 h-3.5')}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mb-1">
                        {s.renderPendingIcon('w-3.5 h-3.5')}
                      </div>
                    )}

                    <span
                      className={`text-[10px] transition-colors duration-200 ${
                        isActive
                          ? isDeliveredActive
                            ? 'font-extrabold text-[#006c49]'
                            : 'font-extrabold text-[#ab2f00]'
                          : isCompleted
                          ? 'font-bold text-slate-800'
                          : 'font-medium text-slate-400'
                      }`}
                    >
                      {s.labelMobile}
                    </span>
                    <span
                      className={`text-[9px] transition-colors duration-200 ${
                        isActive
                          ? isDeliveredActive
                            ? 'text-[#006c49] font-bold'
                            : 'text-[#ab2f00] font-semibold'
                          : isCompleted
                          ? 'text-slate-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.timeMobile}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Live Status Sync Footer (Read-Only) */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-[#006c49]' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                {order.status === 'DELIVERED' ? 'Order Delivered' : 'Live Sync Active'}
              </span>
              <span className="text-slate-400 font-medium">#{order.orderNumber}</span>
            </div>
          </div>

          {/* Courier Card (Mobile) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={order.courier.photoUrl} alt={order.courier.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{order.courier.name}</h4>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                      ★ {order.courier.rating}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{order.courier.vehicle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCallModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center active:scale-95 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center active:scale-95 transition shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
              "{order.courier.note}"
            </div>
          </div>

          {/* Order Details Accordion */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-3.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800"
            >
              <span>Order Details ({order.items.length} items)</span>
              <div className="flex items-center gap-1 text-[#ab2f00]">
                <span>${(order.totalPaise / 100).toFixed(2)}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAccordionOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isAccordionOpen && (
              <div className="p-3.5 bg-white divide-y divide-slate-100 text-xs space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                    {item.imageUrl && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 truncate">
                          {item.quantity}x {item.name}
                        </strong>
                        <span className="font-bold text-slate-800">
                          ${((item.pricePaise * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[10px] text-slate-500 line-clamp-1">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-3 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal &amp; Taxes</span>
                    <span className="font-bold text-slate-800">${(order.subtotalPaise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Delivery</span>
                    <span className="font-bold text-[#006c49]">FREE (Crave+)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courier Gratuity</span>
                    <span className="font-bold text-slate-800">${(order.tipPaise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 text-xs font-black text-slate-900">
                    <span>Paid with Apple Pay</span>
                    <span className="text-[#ab2f00]">${(order.totalPaise / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery OTP Badge (Mobile) */}
          <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-bold text-amber-900">Delivery PIN (OTP):</span>
            </div>
            <span className="font-mono font-black text-base text-amber-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
              {order.deliveryAddress.deliveryOtp || '4192'}
            </span>
          </div>

          {/* Help & Support Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => alert('Support representative is available 24/7 on WhatsApp & Chat.')}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98"
            >
              <HelpCircle className="w-4 h-4 text-[#ab2f00]" />
              <span>Help &amp; Contact Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MODALS (Call & Message with Driver) */}
      {/* ========================================================= */}
      {/* Call Driver Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#006c49] flex items-center justify-center mx-auto shadow-inner">
              <Phone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">Call {order.courier.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Masked secure call line</p>
              <p className="font-mono text-sm font-bold text-[#ab2f00] mt-2">{order.courier.phone}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCallModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <a
                href={`tel:${order.courier.phone}`}
                className="py-2.5 rounded-xl bg-[#006c49] text-white text-xs font-bold shadow-md shadow-[#006c49]/30 flex items-center justify-center"
              >
                Dial Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Message Driver Modal */}
      {messageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                  <img src={order.courier.photoUrl} alt="Courier" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{order.courier.name}</h4>
                  <span className="text-[10px] text-emerald-600 font-bold">Active On Route</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs max-h-56">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-2.5 rounded-2xl max-w-[80%] ${
                      m.sender === 'user'
                        ? 'bg-[#ab2f00] text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type message to courier..."
                className="flex-1 bg-slate-100 text-xs px-3 py-2 rounded-xl outline-none border border-slate-200 focus:bg-white focus:border-[#ab2f00]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#ab2f00] text-white text-xs font-bold shrink-0 hover:bg-[#8f2700] transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
