'use client';

import React from 'react';
import { Power, Shield, BatteryCharging, Radio, MapPin, IndianRupee } from 'lucide-react';

interface OfflineStandbyProps {
  onGoOnline: () => void;
  driverName?: string;
}

export default function OfflineStandby({ onGoOnline, driverName }: OfflineStandbyProps) {
  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
        <Power className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full uppercase tracking-wider">
          Currently Offline
        </span>
        <h2 className="text-xl font-black text-slate-900">
          Ready to deliver, {driverName || 'Partner'}?
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          You are currently off-duty. Go online to join the local dispatch pool and receive instant order pickup alerts with guaranteed payouts.
        </p>
      </div>

      {/* Feature perks pill list */}
      <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">₹65/trip avg</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <BatteryCharging className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Battery Saver</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Instant Dispatch</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">24/7 Safety SOS</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoOnline}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
      >
        <Power className="w-5 h-5" />
        <span>GO ONLINE NOW</span>
      </button>
    </div>
  );
}
