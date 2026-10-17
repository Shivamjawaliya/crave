'use client';

import React, { useState } from 'react';
import { Bike, MapPin, Navigation, CheckCircle, Radio, PhoneCall } from 'lucide-react';

export default function DeliveryDashboardPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeJob, setActiveJob] = useState<{
    id: string;
    orderNumber: string;
    restaurant: string;
    pickupAddress: string;
    customer: string;
    deliveryAddress: string;
    payout: string;
    status: 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED';
  } | null>({
    id: 'del-401',
    orderNumber: 'ORD-729102-4819',
    restaurant: 'Spicy Bites Kitchen',
    pickupAddress: '12 Brigade Road, Bengaluru',
    customer: 'Rahul Sharma',
    deliveryAddress: 'Flat 402, Sunshine Heights, MG Road',
    payout: '₹65.00',
    status: 'ACCEPTED',
  });

  const handleUpdateStatus = (status: 'PICKED_UP' | 'DELIVERED') => {
    if (!activeJob) return;
    if (status === 'DELIVERED') {
      alert('Order successfully marked DELIVERED! Great job.');
      setActiveJob(null);
    } else {
      setActiveJob({ ...activeJob, status });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Alex Rider (Motorcycle)</h1>
            <p className="text-xs text-slate-400">Delivery Partner Console</p>
          </div>
        </div>

        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
            isOnline
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          {isOnline ? 'Online & Available' : 'Offline'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-6">
        {activeJob ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  Active Delivery Trip
                </span>
                <h2 className="text-lg font-bold">{activeJob.orderNumber}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-200">Earning</span>
                <p className="text-xl font-black">{activeJob.payout}</p>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Pickup Stage */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Pickup From
                  </span>
                  <h3 className="font-bold text-slate-900">{activeJob.restaurant}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {activeJob.pickupAddress}
                  </p>
                </div>
              </div>

              {/* Delivery Stage */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Deliver To
                  </span>
                  <h3 className="font-bold text-slate-900">{activeJob.customer}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                    {activeJob.deliveryAddress}
                  </p>
                </div>
              </div>

              {/* Live Location telemetry simulator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  GPS Live Broadcast: 12.9716° N, 77.5946° E
                </span>
                <span className="font-semibold text-emerald-700">Pinging every 10s</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {activeJob.status === 'ACCEPTED' ? (
                  <button
                    onClick={() => handleUpdateStatus('PICKED_UP')}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirm Order Picked Up
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('DELIVERED')}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle className="w-5 h-5" /> Mark Delivered & Collect Cash/Proof
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
            <Bike className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              No active deliveries right now
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Stay online! You will be assigned nearby delivery trips as soon as restaurants mark orders ready.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
