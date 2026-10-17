'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  CheckSquare,
  Square,
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Compass,
  Radio,
  Send,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DeliveryTrip } from '../lib/api';
import { sounds } from '../lib/audio';

interface ActiveTripViewProps {
  trip: DeliveryTrip;
  onUpdateStatus: (newStatus: string, extraData?: any) => Promise<void>;
  onReportIssue: () => void;
  onTripCompleted: () => void;
}

export default function ActiveTripView({
  trip,
  onUpdateStatus,
  onReportIssue,
  onTripCompleted,
}: ActiveTripViewProps) {
  const [loading, setLoading] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([
    'Hello! I am on my way with your food 🛵',
  ]);
  const [chatInput, setChatInput] = useState('');
  const [customerPinInput, setCustomerPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Stages: 'TO_RESTAURANT' | 'AT_RESTAURANT' | 'TO_CUSTOMER' | 'AT_CUSTOMER'
  const getInitialStage = (): 'TO_RESTAURANT' | 'AT_RESTAURANT' | 'TO_CUSTOMER' | 'AT_CUSTOMER' => {
    if (trip.status === 'ARRIVED_AT_STORE') return 'AT_RESTAURANT';
    if (trip.status === 'PICKED_UP' || trip.status === 'IN_TRANSIT') return 'TO_CUSTOMER';
    if (trip.status === 'ARRIVED_AT_CUSTOMER') return 'AT_CUSTOMER';
    return 'TO_RESTAURANT';
  };

  const [currentStage, setCurrentStage] = useState<'TO_RESTAURANT' | 'AT_RESTAURANT' | 'TO_CUSTOMER' | 'AT_CUSTOMER'>(
    getInitialStage
  );

  React.useEffect(() => {
    if (trip.status === 'ARRIVED_AT_STORE') setCurrentStage('AT_RESTAURANT');
    else if (trip.status === 'PICKED_UP' || trip.status === 'IN_TRANSIT') setCurrentStage('TO_CUSTOMER');
    else if (trip.status === 'ARRIVED_AT_CUSTOMER') setCurrentStage('AT_CUSTOMER');
  }, [trip.status]);

  const order = trip.order;
  const restaurantName = order.restaurant?.name || 'Restaurant';
  const restaurantAddress = order.restaurant?.address || 'Restaurant Address';
  const customerName = order.customer?.name || order.addressSnapshot?.customerName || 'Customer';
  const customerPhone =
    order.addressSnapshot?.customerPhone ||
    order.addressSnapshot?.phoneNumber ||
    order.addressSnapshot?.phone ||
    order.customer?.phone ||
    '+91 98260 12345';
  const customerAddress = order.addressSnapshot?.addressLine || 'Customer Address';
  const customerCity = order.addressSnapshot?.city || '';
  const customerInstructions =
    order.addressSnapshot?.instructions ||
    'Please leave package on the bench next to door. Ring bell once.';
  const pickupPin =
    order.addressSnapshot?.pickupOtp ||
    order.addressSnapshot?.verificationCode ||
    order.orderNumber?.slice(-4) ||
    '4821';

  const items = order.items || [];

  // Toggle item in checklist
  const toggleItem = (itemId: string) => {
    setVerifiedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
    sounds.playClickSound();
  };

  const allItemsChecked =
    items.length === 0 || items.every((i) => verifiedItems[i.id]);

  // Stage 1 -> 2: Arrived at restaurant
  const handleArrivedAtStore = async () => {
    setCurrentStage('AT_RESTAURANT');
    sounds.playClickSound();
    setLoading(true);
    try {
      await onUpdateStatus('ARRIVED_AT_STORE');
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setLoading(false);
    }
  };

  // Stage 2 -> 3: Confirm food picked up
  const handleConfirmPickup = async () => {
    setCurrentStage('TO_CUSTOMER');
    sounds.playClickSound();
    setLoading(true);
    try {
      await onUpdateStatus('PICKED_UP', { verificationCode: pickupPin });
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setLoading(false);
    }
  };

  // Stage 3 -> 4: Arrived at customer location
  const handleArrivedAtCustomer = async () => {
    setCurrentStage('AT_CUSTOMER');
    sounds.playClickSound();
    setLoading(true);
    try {
      await onUpdateStatus('ARRIVED_AT_CUSTOMER');
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setLoading(false);
    }
  };

  // Stage 4 -> Completed: Verify PIN & complete delivery
  const handleCompleteDelivery = async () => {
    const pin = customerPinInput.trim();
    if (!pin) {
      setPinError('Please ask customer for their 4-digit PIN and enter it below.');
      return;
    }

    if (pin.length !== 4) {
      setPinError('Please enter a valid 4-digit PIN.');
      return;
    }

    setLoading(true);
    setPinError(null);
    try {
      await onUpdateStatus('DELIVERED', {
        verificationCode: pin,
      });
      sounds.playCelebrationSound();
      onTripCompleted();
    } catch (err: any) {
      setPinError(err.message || 'Invalid Delivery PIN. Please re-check code with the customer.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Chat message send
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, text]);
    setChatInput('');
    sounds.playClickSound();
  };

  // External Google Maps directions URL
  const googleMapsUrl =
    currentStage === 'TO_RESTAURANT' || currentStage === 'AT_RESTAURANT'
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          restaurantName + ' ' + restaurantAddress,
        )}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          customerAddress + ' ' + customerCity,
        )}`;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* Active Trip Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Active Delivery Trip
            </span>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
              {order.orderNumber}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">Earnings</span>
            <span className="text-xl font-black text-emerald-400">₹65.00</span>
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
          <div
            className={`py-1.5 px-1 rounded-xl transition ${
              currentStage === 'TO_RESTAURANT'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-emerald-800/60 text-emerald-300'
            }`}
          >
            1. To Store
          </div>
          <div
            className={`py-1.5 px-1 rounded-xl transition ${
              currentStage === 'AT_RESTAURANT'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : currentStage === 'TO_CUSTOMER' || currentStage === 'AT_CUSTOMER'
                ? 'bg-emerald-800/60 text-emerald-300'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            2. Handover
          </div>
          <div
            className={`py-1.5 px-1 rounded-xl transition ${
              currentStage === 'TO_CUSTOMER'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : currentStage === 'AT_CUSTOMER'
                ? 'bg-emerald-800/60 text-emerald-300'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            3. Customer
          </div>
          <div
            className={`py-1.5 px-1 rounded-xl transition ${
              currentStage === 'AT_CUSTOMER'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            4. Complete
          </div>
        </div>
      </div>

      {/* Simulated Live Turn-by-Turn Map Guidance */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 overflow-hidden relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Live Turn-by-Turn Navigation
              </span>
              <h3 className="text-sm font-black text-slate-900">
                {currentStage === 'TO_RESTAURANT'
                  ? 'Drive 800m to ' + restaurantName
                  : currentStage === 'AT_RESTAURANT'
                  ? 'At ' + restaurantName + ' Pickup Counter'
                  : currentStage === 'TO_CUSTOMER'
                  ? 'Drive 2.8 km to ' + customerName + "'s locality"
                  : 'Arrived outside delivery address'}
              </h3>
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Open in</span>
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Visual Road Simulation Canvas / Bar */}
        <div className="bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs text-emerald-300 font-bold uppercase">
                  {currentStage === 'TO_RESTAURANT'
                    ? 'In 200m • Turn right at Brigade Junction'
                    : currentStage === 'AT_RESTAURANT'
                    ? 'Walk inside to pickup counter'
                    : currentStage === 'TO_CUSTOMER'
                    ? 'In 450m • Keep straight onto 4th Cross Road'
                    : 'Destination reached • Ground Floor'}
                </p>
                <p className="text-base font-black">
                  {currentStage === 'TO_RESTAURANT' || currentStage === 'AT_RESTAURANT'
                    ? restaurantAddress
                    : customerAddress}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Est.</span>
              <span className="text-sm font-black text-emerald-400">
                {currentStage === 'TO_RESTAURANT'
                  ? '3 mins'
                  : currentStage === 'TO_CUSTOMER'
                  ? '12 mins'
                  : 'Now'}
              </span>
            </div>
          </div>

          {/* Telemetry pinging pill */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Broadcasting driver coordinates to customer & kitchen</span>
            </span>
            <span className="text-emerald-400 font-mono">12.9716°N, 77.5946°E</span>
          </div>
        </div>
      </div>

      {/* ---------------- STAGE 1: HEADING TO RESTAURANT ---------------- */}
      {currentStage === 'TO_RESTAURANT' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                Step 1: Heading to Store
              </span>
              <h3 className="font-bold text-base text-slate-900">{restaurantName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{restaurantAddress}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleArrivedAtStore}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-base rounded-2xl shadow-md transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ARRIVED AT RESTAURANT</span>
          </button>
        </div>
      )}

      {/* ---------------- STAGE 2: AT RESTAURANT & HANDOVER (MODULE 4) ---------------- */}
      {currentStage === 'AT_RESTAURANT' && (
        <div className="bg-white rounded-3xl p-5 border-2 border-amber-400/80 shadow-md space-y-5">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Arrived at Store!</strong> Restaurant kitchen staff notified on KDS that rider is waiting.
            </span>
          </div>

          {/* Anti-Theft Pickup PIN Badge */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Theft Pickup Verification PIN
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Show this 4-digit code to kitchen staff:
              </p>
            </div>
            <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-mono font-black text-2xl tracking-widest shadow-inner">
              {pickupPin}
            </div>
          </div>

          {/* Order Bag Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wide">
                Order Bag Checklist ({items.length} items)
              </span>
              <span className="text-[11px] text-slate-500">
                Tap items to confirm before leaving
              </span>
            </div>

            <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-2 border border-slate-200">
              {items.map((item) => {
                const checked = !!verifiedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      {checked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <p className={`text-xs font-bold ${checked ? 'text-slate-900 line-through' : 'text-slate-800'}`}>
                          {item.quantity}x {item.itemName}
                        </p>
                        <p className="text-[10px] text-slate-400">Thermal packed</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      ₹{((item.unitPricePaise * item.quantity) / 100).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmPickup}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CONFIRM FOOD PICKED UP & START ROUTE</span>
          </button>
        </div>
      )}

      {/* ---------------- STAGE 3: ON THE WAY TO CUSTOMER (MODULE 5) ---------------- */}
      {currentStage === 'TO_CUSTOMER' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Step 3: Delivering to Customer
                </span>
                <h3 className="font-bold text-base text-slate-900">{customerName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{customerPhone}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {customerAddress} {customerCity ? `(${customerCity})` : ''}
                </p>
              </div>
            </div>

            {/* Contact buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${customerPhone}`}
                className="w-10 h-10 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm transition"
                title={`Call Customer (${customerPhone})`}
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 shadow-sm transition relative"
                title="Quick Chat"
              >
                <MessageSquare className="w-4 h-4" />
                {chatMessages.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
                )}
              </button>
            </div>
          </div>

          {/* Delivery Special Instructions */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Customer Drop-off Instructions
            </span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              &quot;{customerInstructions}&quot;
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleArrivedAtCustomer}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ARRIVED AT CUSTOMER LOCATION</span>
          </button>
        </div>
      )}

      {/* ---------------- STAGE 4: ARRIVED AT CUSTOMER & DROP VERIFICATION (MODULE 5) ---------------- */}
      {currentStage === 'AT_CUSTOMER' && (
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500 shadow-md space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Arrived Outside!</strong> Push alert sent to customer: &quot;Your delivery partner has arrived outside!&quot;
            </span>
          </div>

          {/* Secure Customer Drop-off PIN Verification */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Customer Delivery PIN Verification
                </span>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  Ask customer for their 4-digit delivery PIN
                </p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                Verification Required
              </span>
            </div>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={customerPinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCustomerPinInput(val);
                setPinError(null);
              }}
              placeholder="Enter 4-digit PIN"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-center text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-400 font-bold shadow-inner"
            />

            {pinError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleCompleteDelivery}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>VERIFY PIN & COMPLETE DELIVERY</span>
          </button>
        </div>
      )}

      {/* In-App Quick Chat Drawer */}
      {showChat && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Customer Chat ({customerName})</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="space-y-2 max-h-40 overflow-y-auto p-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className="bg-emerald-50 text-emerald-950 border border-emerald-100 text-xs p-2.5 rounded-2xl max-w-[85%] ml-auto"
              >
                {msg}
              </div>
            ))}
          </div>

          {/* Quick canned replies */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'I am on my way! 🛵',
              'Arriving in 5 mins.',
              'I am waiting downstairs.',
              'Please check doorbell.',
            ].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => handleSendMessage(quick)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-medium transition"
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Custom text input */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type message to customer..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Exception / Issue Button (Module 7) */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onReportIssue}
          className="text-xs text-slate-400 hover:text-rose-500 transition font-bold flex items-center justify-center gap-1.5 mx-auto"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Report Problem or Issue with this Trip</span>
        </button>
      </div>
    </div>
  );
}
