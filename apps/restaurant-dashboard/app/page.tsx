'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChefHat,
  CheckCircle2,
  XCircle,
  Clock,
  Utensils,
  RefreshCw,
  AlertCircle,
  LogOut,
  MapPin,
  ExternalLink,
  Flame,
  Check,
  Package,
} from 'lucide-react';
import { getOwnerUser, clearOwnerSession, RestaurantOwnerUser } from '../lib/auth';

interface RealOrderItem {
  id: string;
  itemName: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

interface RealOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  items: RealOrderItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  addressSnapshot?: any;
}

export default function RestaurantDashboardPage() {
  const router = useRouter();
  const [owner, setOwner] = useState<RestaurantOwnerUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<RealOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // 1. Auth Guard
  useEffect(() => {
    const user = getOwnerUser();
    if (!user || (user.role !== 'RESTAURANT_OWNER' && user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    setOwner(user);
    setAuthLoading(false);
  }, [router]);

  // 2. Fetch Live Orders for Owner's Restaurant
  const fetchOrders = useCallback(async () => {
    if (!owner?.restaurant?.id) return;
    setLoadingOrders(true);

    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${gatewayUrl}/orders/restaurant/${owner.restaurant.id}`);
      if (res.ok) {
        const data: RealOrder[] = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch restaurant orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [owner]);

  useEffect(() => {
    if (owner?.restaurant?.id) {
      fetchOrders();
    }
  }, [owner, fetchOrders]);

  // 3. Update Order Status Lifecycle in PostgreSQL
  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${gatewayUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, actorId: owner?.id }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)),
        );
        setMessage(`Order updated to ${nextStatus}`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const err = await res.json();
        alert(err.message || 'Status transition failed');
      }
    } catch {
      alert('Failed to connect to gateway');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSignOut = () => {
    clearOwnerSession();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#161c23] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#ab2f00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Authenticating Restaurant Owner Session...
          </p>
        </div>
      </div>
    );
  }

  // Filter orders by stages
  const incomingOrders = orders.filter((o) =>
    ['PLACED', 'PENDING_PAYMENT'].includes(o.status),
  );
  const cookingOrders = orders.filter((o) =>
    ['ACCEPTED', 'PREPARING'].includes(o.status),
  );
  const readyOrders = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status),
  );
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* Toast Notification */}
      {message && (
        <div className="fixed top-5 right-5 z-50 bg-[#006c49] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif font-black text-xl text-slate-900 tracking-tight">
                {owner?.restaurant?.name || 'Artisan Kitchen Display'}
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#ab2f00] px-2.5 py-0.5 rounded-full border border-orange-200">
                Live Kitchen
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{owner?.restaurant?.address || 'Culinary Boulevard'}</span>
            </p>
          </div>
        </div>

        {/* Owner Profile & Actions */}
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-[#006c49] border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse" />
            Kitchen Online & Accepting
          </span>

          {/* Refresh button */}
          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 bg-slate-100 py-1 px-3 rounded-full border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-[#ab2f00] text-white flex items-center justify-center text-xs font-bold">
              {owner?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {owner?.name}
              </span>
              <span className="text-[9px] font-extrabold text-[#ab2f00] uppercase tracking-wider">
                {owner?.role}
              </span>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 p-6 max-w-[1500px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1: Incoming Orders */}
        <div className="bg-slate-200/60 p-4 rounded-3xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-300/60 mb-4">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Incoming Tickets
            </h2>
            <span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {incomingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {incomingOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white/70 rounded-2xl border border-dashed border-slate-300">
                No new incoming tickets
              </div>
            ) : (
              incomingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-400 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 block">
                        #{order.orderNumber}
                      </span>
                      <p className="text-xs font-semibold text-slate-600">
                        {order.customer?.name || 'Customer'}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-700">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="font-medium">
                          {item.quantity}x {item.itemName}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{(item.lineTotalPaise / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-black text-xs text-[#ab2f00]">
                      Total: ₹{(order.totalPaise / 100).toFixed(2)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                        disabled={updatingId === order.id}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                        disabled={updatingId === order.id}
                        className="px-3 py-1 text-xs font-bold text-white bg-[#ab2f00] hover:bg-[#8f2700] rounded-lg flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Accept Ticket
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className="bg-slate-200/60 p-4 rounded-3xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-300/60 mb-4">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Kitchen Cooking
            </h2>
            <span className="text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              {cookingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {cookingOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white/70 rounded-2xl border border-dashed border-slate-300">
                Kitchen station clear
              </div>
            ) : (
              cookingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 block">
                        #{order.orderNumber}
                      </span>
                      <p className="text-xs font-semibold text-slate-600">
                        {order.customer?.name || 'Customer'}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                      {order.status === 'ACCEPTED' ? 'Accepted' : 'Simmering'}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-700">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between font-medium">
                        <span>
                          {item.quantity}x {item.itemName}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex gap-2">
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        disabled={updatingId === order.id}
                        className="flex-1 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <Utensils className="w-3.5 h-3.5" /> Start Cooking
                      </button>
                    )}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                      disabled={updatingId === order.id}
                      className="flex-1 py-1.5 text-xs font-bold text-white bg-[#006c49] hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Food Ready
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready for Courier Pickup */}
        <div className="bg-slate-200/60 p-4 rounded-3xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-300/60 mb-4">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Awaiting Courier
            </h2>
            <span className="text-xs font-black bg-emerald-100 text-[#006c49] px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white/70 rounded-2xl border border-dashed border-slate-300">
                No orders waiting for pickup
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 block">
                        #{order.orderNumber}
                      </span>
                      <p className="text-xs font-semibold text-slate-600">
                        {order.customer?.name || 'Customer'}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-[#006c49] rounded-full border border-emerald-200">
                      Food Packed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Food thermally sealed. Awaiting assigned courier dispatch.
                  </p>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                    disabled={updatingId === order.id}
                    className="w-full py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Simulate Courier Delivery
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Completed Deliveries */}
        <div className="bg-slate-200/60 p-4 rounded-3xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-300/60 mb-4">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              Completed
            </h2>
            <span className="text-xs font-black bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full">
              {completedOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {completedOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white/70 rounded-2xl border border-dashed border-slate-300">
                Completed orders will appear here
              </div>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-xs opacity-90"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-800">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] font-bold text-[#006c49]">Delivered</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{order.customer?.name}</p>
                  <span className="font-bold text-slate-800 block pt-1">
                    ₹{(order.totalPaise / 100).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Crave Merchant Network — Connected to PostgreSQL & Microservices Gateway</span>
        <div className="flex items-center gap-4">
          <a
            href="http://localhost:3000"
            className="hover:text-slate-900 font-bold flex items-center gap-1 text-[#ab2f00]"
          >
            <span>Customer Portal (Port 3000)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
