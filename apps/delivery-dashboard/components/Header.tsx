'use client';

import React from 'react';
import {
  Bike,
  Zap,
  Battery,
  Radio,
  Shield,
  AlertTriangle,
  Wallet,
  User,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { DriverUser, DriverProfile } from '../lib/api';

interface HeaderProps {
  user: DriverUser | null;
  profile: DriverProfile | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  batteryLevel: number | null;
  gpsAccuracy: string;
  activeTab: 'dispatch' | 'earnings';
  setActiveTab: (tab: 'dispatch' | 'earnings') => void;
  onOpenSOS: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export default function Header({
  user,
  profile,
  isOnline,
  onToggleOnline,
  batteryLevel,
  gpsAccuracy,
  activeTab,
  setActiveTab,
  onOpenSOS,
  onOpenProfile,
  onSignOut,
}: HeaderProps) {
  const vehicleType = profile?.vehicleType || 'Motorcycle';
  const vehicleNumber = profile?.vehicleNumber || 'KA-01-EA-4821';

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      {/* Top telemetry strip */}
      <div className="bg-slate-950 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <Radio
              className={`w-3.5 h-3.5 ${
                isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-600'
              }`}
            />
            {isOnline ? (
              <span className="text-emerald-400">
                {gpsAccuracy || 'GPS Live • 10s Pinging'}
              </span>
            ) : (
              <span className="text-slate-500">GPS Standby (Offline)</span>
            )}
          </span>
          <span className="hidden sm:inline-block text-slate-600">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-slate-400" />
            {batteryLevel ? `${batteryLevel}% Battery` : 'Battery Normal'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden xs:flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Verified Partner
          </span>
          <button
            type="button"
            onClick={onOpenSOS}
            className="flex items-center gap-1 text-[11px] font-black bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-sm active:scale-95 transition"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Driver identity */}
        <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={onOpenProfile}>
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              {vehicleType === 'EV' ? <Zap className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base leading-tight truncate text-white">
                {user?.name || 'Alex Rider'}
              </h1>
              <span className="hidden md:inline-block text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                {vehicleNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>{vehicleType}</span>
              <span>•</span>
              <span className={isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                {isOnline ? 'On Duty' : 'Off Duty'}
              </span>
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'dispatch'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trips & Dispatch</span>
            <span className="sm:hidden">Trips</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'earnings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Earnings</span>
            <span className="sm:hidden">Wallet</span>
          </button>
        </div>

        {/* Duty Toggle Switch */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleOnline}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold text-xs transition shadow-sm ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full transition ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="hidden sm:inline">{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</span>
            <span className="sm:hidden">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
