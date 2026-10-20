'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  CookingPot,
  Receipt,
  BookOpen,
  LineChart,
  Store,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  LogOut,
  CheckCircle,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { clearOwnerSession } from '../lib/auth';

export type PortalTab =
  | 'live-orders'
  | 'order-history'
  | 'menu-inventory'
  | 'performance-payouts'
  | 'kitchen-settings';

interface RestaurantOption {
  id: string;
  name: string;
  address: string;
  isAcceptingOrders?: boolean;
}

interface PartnerPortalLayoutProps {
  currentTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  activeOrdersCount: number;
  count86: number;
  ownerName: string;
  activeRestaurant: RestaurantOption | null;
  allOwnerRestaurants: RestaurantOption[];
  onSelectRestaurant: (r: RestaurantOption) => void;
  audioChimeEnabled: boolean;
  onToggleAudioChime: () => void;
  isSocketConnected?: boolean;
  isAcceptingOrders?: boolean;
  onToggleAcceptingOrders?: () => void;
  isTogglingOrders?: boolean;
  children: React.ReactNode;
}

export default function PartnerPortalLayout({
  currentTab,
  onTabChange,
  activeOrdersCount,
  count86,
  ownerName,
  activeRestaurant,
  allOwnerRestaurants,
  onSelectRestaurant,
  audioChimeEnabled,
  onToggleAudioChime,
  isSocketConnected = true,
  isAcceptingOrders = true,
  onToggleAcceptingOrders,
  isTogglingOrders = false,
  children,
}: PartnerPortalLayoutProps) {
  const router = useRouter();
  const [isRestaurantDropdownOpen, setIsRestaurantDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = () => {
    clearOwnerSession();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5fbf6] flex font-sans text-on-surface">
      {/* 1. FIXED LEFT SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col pt-4 pb-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container">
        {/* Portal Branding */}
        <div className="px-4 mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-primary leading-tight">Crave Kitchen</span>
            <span className="text-[10px] text-on-surface-variant font-mono tracking-wider uppercase mt-0.5">
              PARTNER PORTAL
            </span>
          </div>
        </div>

        {/* Live Status Toggle Card */}
        <div className="px-4 mb-4">
          <div
            onClick={onToggleAcceptingOrders}
            className={`p-2.5 bg-white rounded-xl shadow-sm border transition cursor-pointer select-none ${
              isAcceptingOrders
                ? 'border-surface-container hover:border-primary/40'
                : 'border-red-200 bg-red-50/20 hover:border-red-300'
            } flex items-center justify-between group`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAcceptingOrders ? 'bg-primary animate-pulse' : 'bg-red-500'
                }`}
              />
              <span
                className={`text-[11px] font-mono font-bold tracking-wider ${
                  isAcceptingOrders ? 'text-primary' : 'text-red-700'
                }`}
              >
                {isAcceptingOrders ? 'ACCEPTING ORDERS' : 'ORDERS PAUSED'}
              </span>
            </div>
            <button
              type="button"
              disabled={isTogglingOrders}
              onClick={(e) => {
                e.stopPropagation();
                onToggleAcceptingOrders?.();
              }}
              title={isAcceptingOrders ? 'Pause Incoming Orders' : 'Resume Accepting Orders'}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Navigation Rail */}
        <nav className="flex-1 px-3 flex flex-col gap-1 text-xs font-medium">
          {/* 1. Live Orders (KDS) */}
          <button
            type="button"
            onClick={() => onTabChange('live-orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
              currentTab === 'live-orders'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CookingPot className="w-4 h-4" />
              <span>Live Orders (KDS)</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                currentTab === 'live-orders'
                  ? 'bg-primary-container text-white'
                  : 'bg-primary-fixed text-on-primary-fixed'
              }`}
            >
              {activeOrdersCount} Active
            </span>
          </button>

          {/* 2. Order History */}
          <button
            type="button"
            onClick={() => onTabChange('order-history')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left ${
              currentTab === 'order-history'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Order History</span>
          </button>

          {/* 3. Menu & 86 Items */}
          <button
            type="button"
            onClick={() => onTabChange('menu-inventory')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
              currentTab === 'menu-inventory'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" />
              <span>Menu & 86 Items</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                currentTab === 'menu-inventory'
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              {count86} 86&apos;d
            </span>
          </button>

          {/* 4. Performance */}
          <button
            type="button"
            onClick={() => onTabChange('performance-payouts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left ${
              currentTab === 'performance-payouts'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Performance</span>
          </button>

          {/* 5. Kitchen Settings */}
          <button
            type="button"
            onClick={() => onTabChange('kitchen-settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left ${
              currentTab === 'kitchen-settings'
                ? 'bg-primary text-white font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Kitchen Settings</span>
          </button>
        </nav>

        {/* Shift Manager Card */}
        <div className="px-4 pt-3 border-t border-surface-container">
          <div className="p-2.5 bg-surface-container rounded-xl flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant">
                SHIFT MANAGER
              </span>
              <span className="font-semibold text-xs text-on-surface truncate">
                {ownerName || 'Executive Chef'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-primary font-bold shadow-sm">
              Lunch
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APP SHELL (Shifted right by 16rem / 64) */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Fixed Header */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container">
          <div className="h-16 w-full px-6 flex items-center justify-between gap-4">
            {/* Left: Restaurant Selector Dropdown */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRestaurantDropdownOpen(!isRestaurantDropdownOpen)}
                  className="flex items-center gap-2.5 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-xl border border-surface-container shadow-sm transition text-left"
                >
                  <Store className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-on-surface leading-tight truncate max-w-[200px]">
                      {activeRestaurant?.name || 'My Restaurant'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono leading-none truncate max-w-[200px]">
                      {activeRestaurant?.address || 'Active Kitchen Terminal'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {isRestaurantDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-surface-container p-2 space-y-1 z-50 animate-in fade-in">
                    <div className="px-2 py-1 text-[10px] font-mono uppercase text-on-surface-variant font-bold">
                      Your Kitchen Locations
                    </div>
                    {allOwnerRestaurants.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectRestaurant(r);
                          setIsRestaurantDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                          activeRestaurant?.id === r.id
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block truncate">{r.name}</span>
                          <span className="text-[10px] text-on-surface-variant block font-normal truncate">
                            {r.address}
                          </span>
                        </div>
                        {activeRestaurant?.id === r.id && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Avg Prep Telemetry Badge */}
              <div className="hidden xl:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-container">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-xs text-on-surface-variant font-medium">Avg Prep:</span>
                <span className="text-xs text-secondary font-mono font-bold">14 min</span>
              </div>
            </div>

            {/* Right: Audio Chime Toggle, Notification Bell, Profile Avatar */}
            <div className="flex items-center gap-3">
              {/* WebSocket Telemetry Pill */}
              {isSocketConnected ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                  <span>WS LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-bold animate-pulse shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                  <span>WS RECONNECTING</span>
                </div>
              )}

              {/* Audio Chime Toggle */}
              <button
                type="button"
                onClick={onToggleAudioChime}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  audioChimeEnabled
                    ? 'bg-primary-fixed text-on-primary-fixed border-primary/20'
                    : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                }`}
              >
                {audioChimeEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-primary" />
                    <span>Audio Chime: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-on-surface-variant" />
                    <span>Audio Chime: Off</span>
                  </>
                )}
              </button>

              {/* Notifications */}
              <button
                type="button"
                className="relative p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
              </button>

              <div className="h-6 w-px bg-surface-container-highest"></div>

              {/* Profile Avatar & Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm hover:scale-105 transition"
                >
                  {ownerName?.charAt(0)?.toUpperCase() || 'C'}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-surface-container p-2 space-y-1 z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-surface-container">
                      <span className="text-xs font-bold text-on-surface block leading-tight">{ownerName}</span>
                      <span className="text-[10px] font-mono text-primary font-bold">RESTAURANT_OWNER</span>
                    </div>

                    <a
                      href="http://localhost:3000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center justify-between transition"
                    >
                      <span>Customer App (Port 3000)</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Offline Alert Banner */}
        {!isSocketConnected && (
          <div className="fixed top-16 left-64 right-0 z-30 bg-red-600 text-white px-6 py-2 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>⚠️ KITCHEN TERMINAL OFFLINE: WebSocket connection lost. Reconnecting to gateway...</span>
            </div>
            <span className="text-[11px] font-mono opacity-90">Auto-reconnection active</span>
          </div>
        )}

        {/* 3. PAGE BODY CONTENT (Top offset by 4rem / 16) */}
        <main className="relative pt-16 flex-1 min-w-0 bg-[#f5fbf6]">
          {children}
        </main>
      </div>
    </div>
  );
}
