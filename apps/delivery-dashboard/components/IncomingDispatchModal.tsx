'use client';

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  IndianRupee,
  CheckCircle,
  XCircle,
  Flame,
  Volume2,
} from 'lucide-react';
import { DeliveryTrip } from '../lib/api';
import { sounds } from '../lib/audio';

interface IncomingDispatchModalProps {
  job: DeliveryTrip | null;
  onAccept: (jobId: string) => void;
  onDecline: (jobId: string) => void;
}

export default function IncomingDispatchModal({
  job,
  onAccept,
  onDecline,
}: IncomingDispatchModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!job) {
      sounds.stopDispatchLoop();
      return;
    }

    setSecondsLeft(30);
    sounds.startDispatchLoop();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sounds.stopDispatchLoop();
          onDecline(job.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      sounds.stopDispatchLoop();
    };
  }, [job]);

  if (!job) return null;

  const handleAccept = () => {
    sounds.stopDispatchLoop();
    sounds.playClickSound();
    onAccept(job.id);
  };

  const handleDecline = () => {
    sounds.stopDispatchLoop();
    onDecline(job.id);
  };

  const totalItemsCount =
    job.order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
  const restaurantName = job.order.restaurant?.name || 'Restaurant Kitchen';
  const restaurantAddress = job.order.restaurant?.address || 'Local Hub';
  const customerAddress =
    job.order.addressSnapshot?.addressLine || 'Customer Destination';
  const customerCity = job.order.addressSnapshot?.city || '';

  // SVG circular countdown calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / 30) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-emerald-500/80 overflow-hidden relative animate-bounce-subtle">
        {/* Urgent Animated Top Alert */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-5 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-xs font-black tracking-wider uppercase">
              Incoming Trip Dispatch
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>Alert Active</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Circular 30s Countdown & Guaranteed Payout Banner */}
          <div className="flex items-center justify-between bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80">
            <div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                Guaranteed Payout
              </div>
              <div className="text-3xl font-black text-white flex items-center">
                <span>₹65.00</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Base ₹35 + Dist ₹20 + Rush ₹10
              </span>
            </div>

            {/* Circular Timer Ring */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-slate-700"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`${
                    secondsLeft <= 10
                      ? 'stroke-rose-500'
                      : secondsLeft <= 18
                      ? 'stroke-amber-400'
                      : 'stroke-emerald-400'
                  } transition-all duration-1000 ease-linear`}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black leading-none">{secondsLeft}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">sec</span>
              </div>
            </div>
          </div>

          {/* Route Preview Cards */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-amber-500/30">
                1
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    Pickup Store
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">
                    800m • ~3 mins
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white truncate">
                  {restaurantName}
                </h4>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  {restaurantAddress}
                </p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-slate-700 ml-3.5 h-3" />

            {/* Dropoff */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-500/30">
                2
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    Customer Drop-off
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">
                    2.8 km • ~15 mins
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white truncate flex items-center justify-between">
                  <span>{job.order.customer?.name || job.order.addressSnapshot?.customerName || 'Customer'}</span>
                  {(job.order.addressSnapshot?.customerPhone || job.order.customer?.phone) && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {job.order.addressSnapshot?.customerPhone || job.order.customer?.phone}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Navigation className="w-3 h-3 text-slate-500 shrink-0" />
                  {customerAddress} {customerCity ? `(${customerCity})` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Total Trip</span>
              <span className="font-black text-sm text-white">3.6 km</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Est. Time</span>
              <span className="font-black text-sm text-white">~18 mins</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Order Size</span>
              <span className="font-black text-sm text-white">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/40 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle className="w-6 h-6" />
              <span>ACCEPT TRIP ({secondsLeft}s)</span>
            </button>

            <button
              type="button"
              onClick={handleDecline}
              className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition flex items-center justify-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              <span>Decline / Pass to next rider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
