'use client';

import React, { useState } from 'react';
import {
  Wallet,
  IndianRupee,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  Shield,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DriverStats } from '../lib/api';
import { sounds } from '../lib/audio';

interface EarningsDashboardProps {
  stats: DriverStats | null;
  onRefresh?: () => void;
}

export default function EarningsDashboard({ stats }: EarningsDashboardProps) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  const todayEarnings = stats?.todayEarnings || 65;
  const todayTrips = stats?.todayTripsCount || 1;
  const activeHours = stats?.activeOnlineHours || 4.5;
  const weeklyEarnings = stats?.weeklyEarnings || [
    { day: 'Mon', amount: 480, trips: 7 },
    { day: 'Tue', amount: 560, trips: 8 },
    { day: 'Wed', amount: 620, trips: 9 },
    { day: 'Thu', amount: 590, trips: 8 },
    { day: 'Fri', amount: 720, trips: 10 },
    { day: 'Sat', amount: 845, trips: 13 },
    { day: 'Sun', amount: todayEarnings, trips: todayTrips },
  ];

  const maxWeeklyAmount = Math.max(...weeklyEarnings.map((w) => w.amount), 800);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawn(true);
      sounds.playCelebrationSound();
      setTimeout(() => setWithdrawn(false), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-in fade-in">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              Daily Earnings Wallet
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1">
              ₹{todayEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Available for Instant UPI Transfer
            </p>
          </div>

          <button
            type="button"
            disabled={withdrawing || todayEarnings === 0}
            onClick={handleWithdraw}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {withdrawing ? (
              <span>Processing...</span>
            ) : withdrawn ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Transferred to UPI!</span>
              </>
            ) : (
              <>
                <span>Withdraw to UPI</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {withdrawn && (
          <div className="mt-4 p-3 bg-emerald-900/50 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              ₹{todayEarnings} successfully transferred to linked UPI ID <strong>alex@okhdfcbank</strong>!
            </span>
          </div>
        )}
      </div>

      {/* Today's Shift Metrics Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 block uppercase">
            Trips Today
          </span>
          <span className="text-2xl font-black text-slate-900">{todayTrips}</span>
          <span className="text-[10px] text-emerald-600 block font-semibold mt-0.5">
            +100% completion
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 block uppercase">
            Online Hours
          </span>
          <span className="text-2xl font-black text-slate-900">{activeHours}h</span>
          <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">
            Shift Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-2">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 block uppercase">
            Avg / Order
          </span>
          <span className="text-2xl font-black text-slate-900">₹65</span>
          <span className="text-[10px] text-indigo-600 block font-semibold mt-0.5">
            Guaranteed Base
          </span>
        </div>
      </div>

      {/* Payout Breakdown Per Order Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <span>Guaranteed Fare Breakdown</span>
          </h3>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
            ₹65.00 / trip
          </span>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-600">Base Pickup & Drop Fare</span>
            <span className="font-bold text-slate-900">₹35.00</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-600">Distance Compensation (2.8 km @ ₹7/km)</span>
            <span className="font-bold text-slate-900">₹20.00</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-600">Peak Rush Hour Surge Incentive</span>
            <span className="font-bold text-amber-600">+₹10.00</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-600">Customer Direct Tip</span>
            <span className="font-bold text-slate-900">₹0.00 (100% to partner)</span>
          </div>
        </div>
      </div>

      {/* Weekly Earnings History Bar Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Weekly Shift Earnings History</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Monday to Sunday earnings and completed trips
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">7-Day Total</span>
            <span className="text-lg font-black text-emerald-700">
              ₹{weeklyEarnings.reduce((acc, curr) => acc + curr.amount, 0)}
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2 grid grid-cols-7 gap-2 sm:gap-3 items-end h-44 border-b border-slate-100">
          {weeklyEarnings.map((item, idx) => {
            const heightPercent = Math.max(15, Math.round((item.amount / maxWeeklyAmount) * 100));
            const isToday = item.day === 'Sun';

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                  ₹{item.amount}
                </span>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[36px] rounded-2xl transition-all duration-500 ${
                    isToday
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/30'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />

                <span
                  className={`text-xs font-bold ${
                    isToday ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>Today (Active Shift)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span>Past Days</span>
          </span>
        </div>
      </div>
    </div>
  );
}
