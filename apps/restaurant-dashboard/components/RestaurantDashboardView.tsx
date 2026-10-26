'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import PartnerPortalLayout, { PortalTab } from './PartnerPortalLayout';
import LiveOrdersKdsView, { OrderData } from './LiveOrdersKdsView';
import MenuInventoryView, { MenuCategoryData } from './MenuInventoryView';
import PerformanceView from './PerformanceView';
import { getOwnerUser, getOwnerToken, setOwnerSession } from '../lib/auth';
import { playKitchenChime } from './AudioChime';
import {
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  Store,
  MapPin,
  Calendar,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface RestaurantOption {
  id: string;
  name: string;
  address: string;
  isAcceptingOrders?: boolean;
}

const STATUS_RANK: Record<string, number> = {
  PLACED: 1,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  ACCEPTED: 2,
  PREPARING: 3,
  READY_FOR_PICKUP: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
  CANCELLED: 99,
};

export default function RestaurantDashboardView({
  initialTab = 'live-orders',
}: {
  initialTab?: PortalTab;
}) {
  const router = useRouter();

  // Track optimistic state transitions currently in-flight to prevent race condition rollbacks
  const pendingTransitions = React.useRef<Map<string, { status: string; timestamp: number }>>(
    new Map()
  );

  // Auth & Session State
  const [owner, setOwner] = useState<any>(null);
  const [activeRestaurant, setActiveRestaurant] = useState<RestaurantOption | null>(null);
  const [allOwnerRestaurants, setAllOwnerRestaurants] = useState<RestaurantOption[]>([]);
  const [currentTab, setCurrentTab] = useState<PortalTab>(initialTab);
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const user = getOwnerUser();
      const restId = user?.restaurant?.id;
      if (restId) {
        const byId = localStorage.getItem(`restaurant_online_${restId}`);
        if (byId !== null) return byId === 'true';
      }
      const globalCached = localStorage.getItem('kitchen_is_accepting_orders');
      if (globalCached !== null) return globalCached === 'true';
      if (typeof user?.restaurant?.isAcceptingOrders === 'boolean') {
        return user.restaurant.isAcceptingOrders;
      }
    } catch {}
    return true;
  });
  const [isTogglingOrders, setIsTogglingOrders] = useState(false);

  // Live Data State
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [categories, setCategories] = useState<MenuCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Initial Authentication & Identity Check
  useEffect(() => {
    const token = getOwnerToken();
    const user = getOwnerUser();

    if (!token || !user) {
      router.push('/login');
      return;
    }

    setOwner(user);

    // Initial restaurant selection
    if (user.restaurant) {
      const restId = user.restaurant.id;
      const cached = localStorage.getItem(`restaurant_online_${restId}`);
      const initialStatus = cached !== null ? cached === 'true' : (user.restaurant.isAcceptingOrders ?? true);

      const restWithStatus = { ...user.restaurant, isAcceptingOrders: initialStatus };
      setActiveRestaurant(restWithStatus);
      setAllOwnerRestaurants([restWithStatus]);
      setIsAcceptingOrders(initialStatus);
    }

    // Fetch full restaurant list for this owner
    fetchOwnerRestaurants(user.id);
  }, [router]);

  // 2. Fetch all restaurants owned by this owner
  const fetchOwnerRestaurants = async (ownerId: string) => {
    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      const res = await fetch(`${gatewayUrl}/restaurants`);
      if (res.ok) {
        const all: any[] = await res.json();
        const mine = all.filter((r) => r.ownerId === ownerId);
        if (mine.length > 0) {
          const mapped = mine.map((r) => {
            const cached = localStorage.getItem(`restaurant_online_${r.id}`);
            const status = cached !== null ? cached === 'true' : (r.isAcceptingOrders ?? true);
            return {
              id: r.id,
              name: r.name,
              address: r.address,
              isAcceptingOrders: status,
            };
          });
          setAllOwnerRestaurants(mapped);
          if (!activeRestaurant) {
            setActiveRestaurant(mapped[0]);
            setIsAcceptingOrders(mapped[0].isAcceptingOrders ?? true);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch owner restaurants:', e);
    }
  };

  // 3. Load Live Orders & Menu Data for Active Restaurant (Parallelized)
  const loadRestaurantData = useCallback(async () => {
    if (!activeRestaurant?.id) return;

    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      // Fetch Orders and Restaurant details in parallel for maximum speed
      const [ordersRes, restRes] = await Promise.all([
        fetch(`${gatewayUrl}/orders/restaurant/${activeRestaurant.id}`),
        fetch(`${gatewayUrl}/restaurants/${activeRestaurant.id}`),
      ]);

      if (ordersRes.ok) {
        const ordersData: OrderData[] = await ordersRes.json();
        setOrders((prev) => {
          const now = Date.now();
          return ordersData.map((serverOrder) => {
            const pending = pendingTransitions.current.get(serverOrder.id);
            if (pending) {
              const serverRank = STATUS_RANK[serverOrder.status] || 0;
              const pendingRank = STATUS_RANK[pending.status] || 0;
              // If within 20s and the server has not yet caught up to our optimistic click, preserve it!
              if (now - pending.timestamp < 20000 && serverRank < pendingRank) {
                return { ...serverOrder, status: pending.status };
              } else {
                pendingTransitions.current.delete(serverOrder.id);
              }
            }
            return serverOrder;
          });
        });
      }

      if (restRes.ok) {
        const restData = await restRes.json();
        if (restData.categories) {
          setCategories(restData.categories);
        }
        if (typeof restData.isAcceptingOrders === 'boolean') {
          setIsAcceptingOrders(restData.isAcceptingOrders);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`restaurant_online_${activeRestaurant.id}`, String(restData.isAcceptingOrders));
            localStorage.setItem('kitchen_is_accepting_orders', String(restData.isAcceptingOrders));
            const user = getOwnerUser();
            if (user?.restaurant && user.restaurant.id === activeRestaurant.id) {
              user.restaurant.isAcceptingOrders = restData.isAcceptingOrders;
              setOwnerSession(user, getOwnerToken() || '');
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load restaurant data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRestaurant?.id]);

  useEffect(() => {
    loadRestaurantData();
  }, [loadRestaurantData, refreshTrigger]);

  // 4. Real-time RabbitMQ Order Listener via Gateway Socket.IO
  useEffect(() => {
    if (!activeRestaurant?.id) return;

    const gatewaySocketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    const socket: Socket = io(gatewaySocketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('⚡ Restaurant Portal connected to Gateway WebSocket');
      setIsSocketConnected(true);
      socket.emit('restaurant:subscribe', { restaurantId: activeRestaurant.id });
    });

    socket.on('disconnect', () => {
      console.warn('⚠️ Restaurant Portal disconnected from Gateway WebSocket');
      setIsSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setIsSocketConnected(false);
    });

    socket.on('restaurant:new_order', (newOrder: any) => {
      console.log('⚡ Received new incoming order via RabbitMQ/WebSocket:', newOrder);
      if (newOrder.restaurantId === activeRestaurant.id) {
        if (audioChimeEnabled) {
          playKitchenChime();
        }
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber)) {
            return prev.map((o) => {
              if (o.id === newOrder.id || o.orderNumber === newOrder.orderNumber) {
                const currentRank = STATUS_RANK[o.status] || 0;
                const newRank = STATUS_RANK[newOrder.status] || 0;
                return {
                  ...o,
                  ...newOrder,
                  status: currentRank > newRank ? o.status : newOrder.status,
                };
              }
              return o;
            });
          }
          return [newOrder, ...prev];
        });
      }
    });

    socket.on('order_status_updated', (updated: any) => {
      console.log('⚡ Received order_status_updated via WebSocket:', updated);
      const targetId = updated.orderId || updated.id;
      const nextStatus = updated.newStatus || updated.status;
      if (!targetId || !nextStatus) return;

      const pending = pendingTransitions.current.get(targetId);
      if (pending) {
        const nextRank = STATUS_RANK[nextStatus] || 0;
        const pendingRank = STATUS_RANK[pending.status] || 0;
        if (nextRank >= pendingRank) {
          pendingTransitions.current.delete(targetId);
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === targetId ? { ...o, status: nextStatus } : o))
      );
    });

    socket.on('order:status', (updatedOrder: any) => {
      if (updatedOrder.restaurantId && updatedOrder.restaurantId !== activeRestaurant.id) return;
      const targetId = updatedOrder.orderId || updatedOrder.id;
      const nextStatus = updatedOrder.status || updatedOrder.newStatus;
      if (!targetId || !nextStatus) return;

      const pending = pendingTransitions.current.get(targetId);
      if (pending) {
        const nextRank = STATUS_RANK[nextStatus] || 0;
        const pendingRank = STATUS_RANK[pending.status] || 0;
        if (nextRank >= pendingRank) {
          pendingTransitions.current.delete(targetId);
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === targetId ? { ...o, status: nextStatus } : o))
      );
    });

    // Background sync: 15s interval is optimal since WebSocket handles real-time updates
    const interval = setInterval(() => {
      loadRestaurantData();
    }, 15000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [activeRestaurant?.id, audioChimeEnabled, loadRestaurantData]);

  // 4. Order Status Lifecycle Transition Action (Instant Zero-Lag Optimistic UI)
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    // 1. Immediately record in pendingTransitions map
    pendingTransitions.current.set(orderId, { status: nextStatus, timestamp: Date.now() });

    // 2. Immediately update local UI state (0ms latency, instant ticket column transition)
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      const token = getOwnerToken();
      const res = await fetch(`${gatewayUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus, changedBy: 'RESTAURANT' }),
      });

      if (!res.ok) {
        // Rollback if the server rejected the transition
        pendingTransitions.current.delete(orderId);
        setOrders(previousOrders);
        await loadRestaurantData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      // Rollback on network failure
      pendingTransitions.current.delete(orderId);
      setOrders(previousOrders);
      await loadRestaurantData();
    }
  };

  // Kitchen Online / Paused Toggle
  const handleToggleAcceptingOrders = async () => {
    if (!activeRestaurant?.id || isTogglingOrders) return;
    const nextVal = !isAcceptingOrders;

    // 1. Optimistic immediate update for instant UI feedback & sync to localStorage
    setIsAcceptingOrders(nextVal);
    setIsTogglingOrders(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`restaurant_online_${activeRestaurant.id}`, String(nextVal));
      localStorage.setItem('kitchen_is_accepting_orders', String(nextVal));
      const user = getOwnerUser();
      if (user?.restaurant && user.restaurant.id === activeRestaurant.id) {
        user.restaurant.isAcceptingOrders = nextVal;
        setOwnerSession(user, getOwnerToken() || '');
      }
    }

    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      const res = await fetch(`${gatewayUrl}/restaurants/${activeRestaurant.id}/orders-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAcceptingOrders: nextVal }),
      });

      if (!res.ok) {
        console.error('Failed to update kitchen online status, rolling back...');
        setIsAcceptingOrders(!nextVal);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`restaurant_online_${activeRestaurant.id}`, String(!nextVal));
          localStorage.setItem('kitchen_is_accepting_orders', String(!nextVal));
          const user = getOwnerUser();
          if (user?.restaurant && user.restaurant.id === activeRestaurant.id) {
            user.restaurant.isAcceptingOrders = !nextVal;
            setOwnerSession(user, getOwnerToken() || '');
          }
        }
      } else {
        const updated = await res.json();
        const finalStatus = updated.isAcceptingOrders ?? nextVal;
        setIsAcceptingOrders(finalStatus);
        setActiveRestaurant((prev) => (prev ? { ...prev, isAcceptingOrders: finalStatus } : null));
        setAllOwnerRestaurants((prev) =>
          prev.map((r) => (r.id === activeRestaurant.id ? { ...r, isAcceptingOrders: finalStatus } : r))
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(`restaurant_online_${activeRestaurant.id}`, String(finalStatus));
          localStorage.setItem('kitchen_is_accepting_orders', String(finalStatus));
        }
      }
    } catch (err) {
      console.error('Error toggling kitchen status:', err);
      setIsAcceptingOrders(!nextVal);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`restaurant_online_${activeRestaurant.id}`, String(!nextVal));
        localStorage.setItem('kitchen_is_accepting_orders', String(!nextVal));
      }
    } finally {
      setIsTogglingOrders(false);
    }
  };

  // Computed metrics for layout badges
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'PLACED' ||
        o.status === 'PENDING_PAYMENT' ||
        o.status === 'ACCEPTED' ||
        o.status === 'PREPARING' ||
        o.status === 'READY_FOR_PICKUP' ||
        o.status === 'OUT_FOR_DELIVERY'
    ).length;
  }, [orders]);

  const count86 = useMemo(() => {
    const all = categories.flatMap((c) => c.items);
    return all.filter((i) => !i.isAvailable).length;
  }, [categories]);

  // Order History completed items
  const historyOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');
  }, [orders]);

  if (!owner) {
    return (
      <div className="min-h-screen bg-[#f5fbf6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <PartnerPortalLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      activeOrdersCount={activeOrdersCount}
      count86={count86}
      ownerName={owner.name}
      activeRestaurant={activeRestaurant}
      allOwnerRestaurants={allOwnerRestaurants}
      onSelectRestaurant={(r) => {
        setActiveRestaurant(r);
        const cached = typeof window !== 'undefined' ? localStorage.getItem(`restaurant_online_${r.id}`) : null;
        const status = cached !== null ? cached === 'true' : (r.isAcceptingOrders ?? true);
        setIsAcceptingOrders(status);
        setRefreshTrigger((prev) => prev + 1);
      }}
      audioChimeEnabled={audioChimeEnabled}
      onToggleAudioChime={() => setAudioChimeEnabled(!audioChimeEnabled)}
      isSocketConnected={isSocketConnected}
      isAcceptingOrders={isAcceptingOrders}
      onToggleAcceptingOrders={handleToggleAcceptingOrders}
      isTogglingOrders={isTogglingOrders}
    >
      {/* VIEW 1: LIVE ORDERS (KDS) */}
      {currentTab === 'live-orders' && (
        <LiveOrdersKdsView
          orders={orders}
          restaurantId={activeRestaurant?.id || ''}
          onUpdateStatus={handleUpdateOrderStatus}
          audioChimeEnabled={audioChimeEnabled}
        />
      )}

      {/* VIEW 2: MENU & 86 INVENTORY */}
      {currentTab === 'menu-inventory' && (
        <MenuInventoryView
          restaurantId={activeRestaurant?.id || ''}
          categories={categories}
          onRefreshData={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}

      {/* VIEW 3: PERFORMANCE & SETTLEMENT */}
      {currentTab === 'performance-payouts' && (
        <PerformanceView
          restaurantName={activeRestaurant?.name || 'My Kitchen'}
        />
      )}

      {/* VIEW 4: ORDER HISTORY */}
      {currentTab === 'order-history' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">
                Completed Order Archive
              </h1>
              <p className="text-xs text-on-surface-variant pt-0.5">
                Audit trail of completed pickups, handovers, and historical tickets.
              </p>
            </div>
            <span className="px-3 py-1 bg-surface-container text-on-surface font-mono text-xs font-bold rounded-lg">
              {historyOrders.length} Total Handled
            </span>
          </div>

          {historyOrders.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-surface-container text-center space-y-2 text-xs text-on-surface-variant shadow-sm">
              <CheckCircle className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-bold text-sm text-on-surface">No historical tickets yet</h3>
              <p>Completed orders from the KDS rail will be archived here automatically.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-container shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-container bg-surface-container-low text-[10px] font-mono uppercase text-on-surface-variant">
                    <th className="p-4 font-bold">Ticket #</th>
                    <th className="p-4 font-bold">Items Ordered</th>
                    <th className="p-4 font-bold">Destination / Courier</th>
                    <th className="p-4 font-bold text-right">Total Price</th>
                    <th className="p-4 font-bold text-center">Final Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container/60">
                  {historyOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-container-low transition">
                      <td className="p-4 font-mono font-bold text-on-surface">
                        #{ord.orderNumber}
                      </td>
                      <td className="p-4 space-y-0.5">
                        {ord.items.map((it, i) => (
                          <div key={i} className="text-[11px] text-on-surface">
                            <span className="font-bold font-mono">{it.quantity}x</span> {it.itemName}
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-[11px] text-on-surface-variant">
                        <span>{ord.addressSnapshot?.addressLine || 'Table Pickup'}</span>
                        <span className="block text-[10px] text-primary font-semibold">
                          {ord.addressSnapshot?.courier || 'Marcus Chen (Courier)'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-on-surface">
                        ₹{(ord.totalPaise / 100).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: KITCHEN SETTINGS */}
      {currentTab === 'kitchen-settings' && (
        <div className="p-6 max-w-3xl space-y-6">
          <div className="pb-2 border-b border-surface-container">
            <h1 className="text-2xl font-black text-on-surface tracking-tight">
              Kitchen Operational Settings
            </h1>
            <p className="text-xs text-on-surface-variant pt-0.5">
              Manage terminal hardware, station audio chimes, operating schedules, and pickup counters.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-container shadow-sm space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface block">Culinary Brand Name</label>
              <input
                type="text"
                disabled
                value={activeRestaurant?.name || ''}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface block">Kitchen Station Address</label>
              <input
                type="text"
                disabled
                value={activeRestaurant?.address || ''}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-surface-container-highest bg-surface-container-low text-on-surface font-semibold"
              />
            </div>

            <div className="pt-3 border-t border-surface-container space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono">
                Storefront Online & Ordering Status
              </h4>
              <div className={`p-4 rounded-xl border transition flex items-center justify-between ${
                isAcceptingOrders
                  ? 'bg-primary-container/20 border-primary/30'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAcceptingOrders ? 'bg-primary animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-on-surface">
                      {isAcceptingOrders ? 'Accepting Orders (Online)' : 'Orders Paused (Offline)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                    {isAcceptingOrders
                      ? 'Kitchen is open and visible to customers on the app.'
                      : 'Kitchen is hidden from customer exploration and orders are paused.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAcceptingOrders}
                  disabled={isTogglingOrders}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition shadow-sm ${
                    isAcceptingOrders
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  {isAcceptingOrders ? 'Pause Incoming Orders' : 'Resume Accepting Orders'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono">
                Audio Chime Configurations
              </h4>
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-on-surface block">Order Bell Tone</span>
                  <span className="text-[11px] text-on-surface-variant">Synthesized dual-tone bell on ticket arrival</span>
                </div>
                <span className="px-2 py-1 rounded bg-white text-primary font-mono text-xs font-bold shadow-sm">
                  880Hz / 1320Hz High Pitch
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-mono">
              <span>Terminal Node ID: <strong>BHOPAL-KDS-POS-01</strong></span>
              <span>PostgreSQL Sync: <strong>CONNECTED</strong></span>
            </div>
          </div>
        </div>
      )}
    </PartnerPortalLayout>
  );
}
