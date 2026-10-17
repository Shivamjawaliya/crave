'use client';

import React, { useState } from 'react';
import { ChefHat, CheckCircle2, XCircle, Clock, Utensils, RefreshCw, AlertCircle } from 'lucide-react';

export default function RestaurantDashboardPage() {
  const [orders, setOrders] = useState([
    {
      id: 'ord-101',
      orderNumber: 'ORD-729102-4819',
      customer: 'Rahul Sharma',
      items: [
        { name: 'Paneer Tikka Royale', quantity: 2, price: '₹560' },
        { name: 'Dum Hyderabadi Biryani', quantity: 1, price: '₹390' },
      ],
      total: '₹950',
      status: 'PLACED',
      placedAt: '2 mins ago',
    },
    {
      id: 'ord-102',
      orderNumber: 'ORD-729102-5120',
      customer: 'Sneha Patel',
      items: [
        { name: 'Murgh Malai Kebab', quantity: 1, price: '₹340' },
        { name: 'Mango Lassi', quantity: 2, price: '₹240' },
      ],
      total: '₹580',
      status: 'PREPARING',
      placedAt: '12 mins ago',
    },
  ]);

  const updateOrderStatus = (id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">
              Spicy Bites Kitchen — Live Kitchen Display
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Accept orders, trigger kitchen prep, and signal delivery pickup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Kitchen Online & Accepting
          </span>
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Incoming Orders */}
        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Incoming Orders
            </h2>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {orders.filter((o) => o.status === 'PLACED').length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {orders
              .filter((o) => o.status === 'PLACED')
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-slate-500">{order.customer}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {order.placedAt}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-700">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-slate-500">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-xs text-slate-900">
                      Total: {order.total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Prep
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Kitchen Cooking
            </h2>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {orders.filter((o) => o.status === 'PREPARING').length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {orders
              .filter((o) => o.status === 'PREPARING')
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-slate-500">{order.customer}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                      Cooking
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-700">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                    className="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Ready for Pickup
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Column 3: Ready for Delivery */}
        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ready for
              Pickup
            </h2>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {orders.filter((o) => o.status === 'READY_FOR_PICKUP').length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-auto">
            {orders
              .filter((o) => o.status === 'READY_FOR_PICKUP')
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-slate-500">{order.customer}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      Awaiting Rider
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    Food packed and hot. Waiting for assigned delivery partner.
                  </p>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
