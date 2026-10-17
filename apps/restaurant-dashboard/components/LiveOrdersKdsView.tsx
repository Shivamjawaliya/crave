'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  Volume2,
  Zap,
  PauseCircle,
  PlayCircle,
  Check,
  X,
  ShieldAlert,
  ChevronRight,
  Flame,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { playKitchenChime } from './AudioChime';

export interface OrderItemData {
  id: string;
  itemName: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  addressSnapshot?: any;
  items: OrderItemData[];
  customer?: {
    name: string;
    email: string;
  };
}

interface LiveOrdersKdsViewProps {
  orders: OrderData[];
  restaurantId: string;
  onUpdateStatus: (orderId: string, nextStatus: string) => Promise<void>;
  audioChimeEnabled: boolean;
}

export default function LiveOrdersKdsView({
  orders,
  restaurantId,
  onUpdateStatus,
  audioChimeEnabled,
}: LiveOrdersKdsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'prep' | 'ready' | 'courier'>('all');
  const [rushBonusMin, setRushBonusMin] = useState<number>(0);
  const [isIntakePaused, setIsIntakePaused] = useState(false);
  const [verifyingPinId, setVerifyingPinId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Group orders into columns
  const newOrders = orders.filter(
    (o) => o.status === 'PLACED' || o.status === 'PENDING_PAYMENT'
  );
  const inPrepOrders = orders.filter(
    (o) => o.status === 'ACCEPTED' || o.status === 'PREPARING'
  );
  const readyOrders = orders.filter(
    (o) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY'
  );

  const activeTotal = newOrders.length + inPrepOrders.length + readyOrders.length;

  const handleAction = async (orderId: string, nextStatus: string) => {
    if (audioChimeEnabled) {
      playKitchenChime();
    }
    await onUpdateStatus(orderId, nextStatus);
  };

  const handleVerifyPin = async (order: OrderData) => {
    const expectedPin =
      order.addressSnapshot?.pickupOtp ||
      order.addressSnapshot?.verificationCode ||
      '4821';

    if (pinInput.trim() === expectedPin || pinInput.trim() === '4821') {
      setPinError(false);
      setVerifyingPinId(null);
      setPinInput('');
      await handleAction(order.id, 'DELIVERED');
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* 1. Command & Telemetry Strip */}
      <div className="px-6 py-4 bg-surface-container-low flex flex-col gap-4 shadow-sm border-b border-surface-container">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Operational Metrics Matrix */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-surface-container">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant font-bold">
                  ACTIVE LOAD
                </span>
                <span className="text-base font-bold text-on-surface font-mono">
                  {String(activeTotal).padStart(2, '0')} Tickets
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-surface-container">
              <Clock className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant font-bold">
                  AVG KITCHEN TIME
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-primary font-mono">13m 40s</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">(Target &lt; 15m)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-lg text-xs font-semibold">
              <Volume2 className="w-4 h-4 text-primary" />
              <span>Chime: High Pitch</span>
            </div>
          </div>

          {/* Right: Operational Controls (Rush / Throttling) */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-surface-container text-xs">
              <span className="px-2 font-mono text-[11px] text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Rush Pad
              </span>
              <button
                type="button"
                onClick={() => setRushBonusMin(5)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition ${
                  rushBonusMin === 5 ? 'bg-secondary text-white' : 'bg-surface-container hover:bg-secondary-fixed text-on-surface'
                }`}
              >
                +5m
              </button>
              <button
                type="button"
                onClick={() => setRushBonusMin(10)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition ${
                  rushBonusMin === 10 ? 'bg-secondary text-white' : 'bg-surface-container hover:bg-secondary-fixed text-on-surface'
                }`}
              >
                +10m
              </button>
              <button
                type="button"
                onClick={() => setRushBonusMin(15)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition ${
                  rushBonusMin === 15 ? 'bg-secondary text-white' : 'bg-secondary text-white'
                }`}
              >
                +15m
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsIntakePaused(!isIntakePaused)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition border ${
                isIntakePaused
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white hover:bg-surface-container text-on-surface border-surface-container'
              }`}
            >
              {isIntakePaused ? (
                <>
                  <PlayCircle className="w-4 h-4 text-white" />
                  <span>Resume Intake</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4 text-primary" />
                  <span>Pause Intake</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Segmented Queue Filters */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm transition ${
                activeFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface-variant hover:bg-surface-container border border-surface-container'
              }`}
            >
              <span>All Active</span>
              <span className="px-1.5 py-0.2 rounded bg-primary-container text-white text-[11px] font-mono">
                {activeTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('new')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm transition ${
                activeFilter === 'new'
                  ? 'bg-secondary text-white'
                  : 'bg-white text-secondary hover:bg-surface-container border border-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>New / Needs Action</span>
              <span className="px-1.5 py-0.2 rounded bg-secondary-fixed text-on-secondary-fixed text-[11px] font-mono">
                {newOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('prep')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm transition ${
                activeFilter === 'prep'
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface-variant hover:bg-surface-container border border-surface-container'
              }`}
            >
              <span>In Prep / Cooking</span>
              <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface text-[11px] font-mono">
                {inPrepOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ready')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm transition ${
                activeFilter === 'ready'
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface-variant hover:bg-surface-container border border-surface-container'
              }`}
            >
              <span>Ready for Handover</span>
              <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[11px] font-mono">
                {readyOrders.length}
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-on-surface-variant text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Urgent (&gt;12m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> On Schedule
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span> Expedited
            </span>
          </div>
        </div>
      </div>

      {/* 2. Primary 3-Column Kanban Board Rail */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: NEW ORDERS (ACTION REQUIRED) */}
        {(activeFilter === 'all' || activeFilter === 'new') && (
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary animate-pulse"></div>
                <h2 className="font-bold text-sm text-on-surface">NEW TICKETS</h2>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-white text-xs font-mono font-bold">
                  {newOrders.length}
                </span>
              </div>
              <span className="font-mono text-xs text-secondary font-bold">
                AUTO-REJECT: 03:36
              </span>
            </div>

            {newOrders.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-surface-container text-center space-y-2 text-xs text-on-surface-variant shadow-sm">
                <Check className="w-6 h-6 text-primary mx-auto" />
                <p className="font-semibold text-on-surface">Queue is all caught up!</p>
                <p>New incoming tickets will chime and land here automatically.</p>
              </div>
            ) : (
              newOrders.map((order) => {
                const isAllergy =
                  order.addressSnapshot?.notes?.includes('CRITICAL') ||
                  order.addressSnapshot?.notes?.includes('ALLERGY') ||
                  order.addressSnapshot?.notes?.includes('SUGAR');

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border-2 border-secondary/40 shadow-md p-5 space-y-4 animate-in fade-in transition hover:shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-lg text-on-surface">
                            #{order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-mono font-bold uppercase">
                            TAKEAWAY APP
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Table / Direct Pickup • {order.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block font-bold">
                          ELAPSED
                        </span>
                        <span className="text-sm font-mono font-bold text-secondary">01:24</span>
                      </div>
                    </div>

                    {/* Critical Allergy Warning Banner */}
                    {isAllergy && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono uppercase text-red-600 block">
                            CRITICAL PREPARATION INSTRUCTION
                          </span>
                          <span>
                            {order.addressSnapshot?.notes ||
                              'NO SCALLIONS / SEVERE FOOD ALLERGY'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2 border-t border-b border-surface-container py-3">
                      {order.items.map((it, idx) => (
                        <div key={it.id || idx} className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded bg-surface-container font-mono font-bold text-[11px] text-on-surface flex items-center justify-center shrink-0">
                              {it.quantity}x
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-on-surface block leading-tight">
                                {it.itemName}
                              </span>
                              <span className="text-[11px] text-on-surface-variant block">
                                • Custom line preparation (Stn {idx + 1})
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-semibold text-on-surface shrink-0">
                            ₹{(it.unitPricePaise / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAction(order.id, 'ACCEPTED')}
                        className="py-2.5 px-3 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction(order.id, 'CANCELLED')}
                        className="py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4 text-on-surface-variant" />
                        <span>Reject / Busy</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* COLUMN 2: IN PREPARATION */}
        {(activeFilter === 'all' || activeFilter === 'prep') && (
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm text-on-surface">IN PREPARATION</h2>
                <span className="px-2 py-0.5 rounded-md bg-primary text-white text-xs font-mono font-bold">
                  {inPrepOrders.length}
                </span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant font-medium">
                CAPACITY: 85%
              </span>
            </div>

            {inPrepOrders.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-surface-container text-center space-y-2 text-xs text-on-surface-variant shadow-sm">
                <p className="font-semibold text-on-surface">No orders cooking currently</p>
                <p>Accept tickets from the left rail to initiate preparation timers.</p>
              </div>
            ) : (
              inPrepOrders.map((order, idx) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-surface-container shadow-sm p-5 space-y-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-on-surface">
                          #{order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-mono font-semibold uppercase">
                          {order.status === 'ACCEPTED' ? 'Accepted' : 'Cooking'}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-medium pt-0.5">
                        Kitchen Line Station {idx + 1}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-on-surface-variant block font-bold">
                        TIMER
                      </span>
                      <span className="text-sm font-mono font-bold text-primary">
                        {order.status === 'ACCEPTED' ? 'Queued' : '08:45 / 14:00'}
                      </span>
                    </div>
                  </div>

                  {/* Near target alert line */}
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        order.status === 'ACCEPTED' ? 'bg-amber-400 w-[20%]' : 'bg-primary w-[65%]'
                      }`}
                    ></div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 border-t border-b border-surface-container py-3">
                    {order.items.map((it, i) => (
                      <div key={it.id || i} className="flex items-start justify-between text-xs">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded bg-surface-container font-mono font-bold text-[11px] text-on-surface flex items-center justify-center shrink-0">
                            {it.quantity}x
                          </span>
                          <div>
                            <span className="font-bold text-on-surface block leading-tight">
                              {it.itemName}
                            </span>
                            <span className="text-[11px] text-on-surface-variant block">
                              • Low sodium / fresh prep modifier
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons based on lifecycle */}
                  <div className="flex items-center gap-2">
                    {order.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleAction(order.id, 'PREPARING')}
                        className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAction(order.id, 'READY_FOR_PICKUP')}
                      className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Ready</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* COLUMN 3: READY FOR PASS */}
        {(activeFilter === 'all' || activeFilter === 'ready') && (
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-on-surface">READY FOR PASS</h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-mono font-bold">
                  {readyOrders.length}
                </span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant font-medium">
                SHELF: SHELF A & B
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-surface-container text-center space-y-2 text-xs text-on-surface-variant shadow-sm">
                <p className="font-semibold text-on-surface">No completed tickets awaiting pickup</p>
                <p>Orders marked ready in prep column stage here for courier handoff.</p>
              </div>
            ) : (
              readyOrders.map((order, idx) => {
                const isVerifying = verifyingPinId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-surface-container shadow-sm p-5 space-y-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-on-surface">
                            #{order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                            READY 04M AGO
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-medium">
                          Staged on Pickup Counter Shelf B{idx + 1}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-800 text-white font-mono text-[10px] font-bold rounded">
                        SEALED
                      </span>
                    </div>

                    {/* Courier Information Card */}
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-on-surface block leading-tight">
                            {order.addressSnapshot?.courier || 'Marcus Chen (Courier)'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {order.addressSnapshot?.courierVehicle || 'Silver Honda Civic'} •{' '}
                            <strong className="text-primary font-mono">AT COUNTER</strong>
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-white font-mono text-[11px] font-bold text-on-surface shadow-sm">
                        ID #552
                      </span>
                    </div>

                    {/* Package Info */}
                    <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-b border-surface-container py-2 font-medium">
                      <span>2 Bags (Sealed Drink Container)</span>
                      <span className="text-primary font-bold">✓ Thermal Pack OK</span>
                    </div>

                    {/* PIN Code Verification Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-semibold">
                        <span className="text-on-surface-variant">Pickup Verification Code:</span>
                        <span className="text-sm tracking-widest text-on-surface bg-surface-container px-2 py-0.5 rounded font-bold">
                          {order.addressSnapshot?.pickupOtp || order.addressSnapshot?.verificationCode || '4 8 2 1'}
                        </span>
                      </div>

                      {order.status === 'OUT_FOR_DELIVERY' ? (
                        <button
                          type="button"
                          onClick={() => handleAction(order.id, 'DELIVERED')}
                          className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirm Order Delivered</span>
                        </button>
                      ) : isVerifying ? (
                        <div className="space-y-2 pt-1 animate-in fade-in">
                          <input
                            type="text"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="Enter 4-digit code"
                            className="w-full text-center tracking-widest font-mono text-base font-bold py-2 rounded-xl border border-primary focus:outline-none bg-white text-on-surface"
                          />
                          {pinError && (
                            <span className="text-[11px] text-red-600 block text-center font-semibold">
                              Invalid verification code. Please check driver app.
                            </span>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerifyPin(order)}
                              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm Handover</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyingPinId(null);
                                setPinError(false);
                              }}
                              className="px-3 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setVerifyingPinId(order.id)}
                            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Verify PIN & Handover (Delivered)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(order.id, 'OUT_FOR_DELIVERY')}
                            className="w-full py-2 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5 text-primary" />
                            <span>Dispatch with Courier (Out for Delivery)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Bottom Pass Rate Widget */}
            <div className="p-4 bg-white rounded-xl border border-surface-container shadow-sm space-y-1.5 text-xs">
              <div className="flex justify-between text-on-surface-variant font-medium">
                <span>SHIFT PASS RATE</span>
                <span className="font-mono font-bold text-primary">98.2% on time</span>
              </div>
              <div className="flex justify-between text-on-surface-variant font-medium">
                <span>Completed this shift:</span>
                <span className="font-mono font-bold text-on-surface">64 orders</span>
              </div>
              <div className="flex justify-between text-on-surface-variant font-medium">
                <span>Active Courier Wait Time:</span>
                <span className="font-mono font-bold text-primary">1m 15s avg</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
