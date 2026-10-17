'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PartnerPortalLayout, { PortalTab } from '../components/PartnerPortalLayout';
import LiveOrdersKdsView, { OrderData } from '../components/LiveOrdersKdsView';
import MenuInventoryView, { MenuCategoryData } from '../components/MenuInventoryView';
import PerformanceView from '../components/PerformanceView';
import { getOwnerUser, getOwnerToken } from '../lib/auth';
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
}

export default function RestaurantDashboardPage({
  initialTab = 'live-orders',
}: {
  initialTab?: PortalTab;
} = {}) {
  const router = useRouter();

  // Auth & Session State
  const [owner, setOwner] = useState<any>(null);
  const [activeRestaurant, setActiveRestaurant] = useState<RestaurantOption | null>(null);
  const [allOwnerRestaurants, setAllOwnerRestaurants] = useState<RestaurantOption[]>([]);
  const [currentTab, setCurrentTab] = useState<PortalTab>(initialTab);
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);

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
      setActiveRestaurant(user.restaurant);
      setAllOwnerRestaurants([user.restaurant]);
    }

    // Fetch full restaurant list for this owner
    fetchOwnerRestaurants(user.id);
  }, [router]);

  // 2. Fetch all restaurants owned by this owner
  const fetchOwnerRestaurants = async (ownerId: string) => {
    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${gatewayUrl}/restaurants`);
      if (res.ok) {
        const all: any[] = await res.json();
        const mine = all.filter((r) => r.ownerId === ownerId);
        if (mine.length > 0) {
          setAllOwnerRestaurants(
            mine.map((r) => ({ id: r.id, name: r.name, address: r.address }))
          );
          if (!activeRestaurant) {
            setActiveRestaurant({
              id: mine[0].id,
              name: mine[0].name,
              address: mine[0].address,
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch owner restaurants:', e);
    }
  };

  // 3. Load Live Orders & Menu Data for Active Restaurant
  const loadRestaurantData = useCallback(async () => {
    if (!activeRestaurant?.id) return;

    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      // A. Fetch Orders
      const ordersRes = await fetch(
        `${gatewayUrl}/orders/restaurant/${activeRestaurant.id}`
      );
      if (ordersRes.ok) {
        const ordersData: OrderData[] = await ordersRes.json();
        setOrders(ordersData);
      }

      // B. Fetch Menu & Categories
      const restRes = await fetch(
        `${gatewayUrl}/restaurants/${activeRestaurant.id}`
      );
      if (restRes.ok) {
        const restData = await restRes.json();
        if (restData.categories) {
          setCategories(restData.categories);
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

  // 4. Order Status Lifecycle Transition Action
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${gatewayUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        // Optimistically update local order status
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      } else {
        await loadRestaurantData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      await loadRestaurantData();
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
        setRefreshTrigger((prev) => prev + 1);
      }}
      audioChimeEnabled={audioChimeEnabled}
      onToggleAudioChime={() => setAudioChimeEnabled(!audioChimeEnabled)}
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
