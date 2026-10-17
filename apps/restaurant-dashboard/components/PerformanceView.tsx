'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface PerformanceViewProps {
  restaurantName: string;
}

export default function PerformanceView({ restaurantName }: PerformanceViewProps) {
  const [activeDateTab, setActiveDateTab] = useState<'today' | 'yesterday' | '7days' | 'monthly'>('today');

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Period\n' +
      `Net Sales,2845.50,Today\n` +
      `Completed Orders,118,Today\n` +
      `Avg Prep Pace,13.2 min,Today\n` +
      `Guest Rating,4.9,Today\n` +
      `Next Payout,14210.80,Scheduled Oct 25\n` +
      `Gross Sales,17640.00,Oct 14-20\n` +
      `Platform Fee (15%),-2646.00,Oct 14-20\n` +
      `Courier Network Subsidy,-382.40,Oct 14-20\n` +
      `Sales Tax Remitted,-1411.20,Oct 14-20\n` +
      `Promotional Boost,+1010.40,Oct 14-20\n` +
      `Net Handoff Total,14210.80,Verified for ACH\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `settlement_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-y-auto px-6 py-6 space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-primary uppercase tracking-wider mb-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>LIVE OPERATIONAL TELEMETRY • UPDATED 2 MIN AGO</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">
            Kitchen Operations & Settlement Ledger
          </h1>
          <p className="text-xs text-on-surface-variant pt-0.5">
            Real-time throughput metrics, financial reconciliation, and culinary speed indicators.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Selector */}
          <div className="bg-surface-container-low p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveDateTab('today')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeDateTab === 'today'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Today • Live
            </button>
            <button
              onClick={() => setActiveDateTab('yesterday')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeDateTab === 'yesterday'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setActiveDateTab('7days')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeDateTab === '7days'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setActiveDateTab('monthly')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeDateTab === 'monthly'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Monthly Payout
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-surface-container border border-surface-container-high text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Statements</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Net Sales */}
        <div className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
              NET SALES TODAY
            </span>
            <div className="w-6 h-6 rounded bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-on-surface font-mono">₹2,845.50</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+14.2% vs yesterday</span>
            </div>
          </div>
          <div className="pt-1 border-t border-surface-container text-[10px] text-on-surface-variant flex justify-between font-mono">
            <span>Target: ₹3,200</span>
            <span className="font-bold text-primary">88.9%</span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
              COMPLETED ORDERS
            </span>
            <div className="w-6 h-6 rounded bg-surface-container text-primary flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-on-surface font-mono">118</span>
            <span className="text-xs text-on-surface-variant font-medium ml-1">Tickets</span>
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium pt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-mono font-bold">
                0.8% Drop
              </span>
              <span>Cancellation rate</span>
            </div>
          </div>
          <div className="pt-1 border-t border-surface-container text-[10px] text-on-surface-variant flex justify-between font-mono">
            <span>Kitchen Health</span>
            <span className="font-bold text-emerald-700">● Excellent</span>
          </div>
        </div>

        {/* Ticket Prep Pace */}
        <div className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
              TICKET PREP PACE
            </span>
            <div className="w-6 h-6 rounded bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-on-surface font-mono">13.2</span>
            <span className="text-xs text-on-surface-variant font-medium ml-1">min</span>
            <div className="flex items-center gap-1 text-[11px] text-primary font-semibold pt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>1.8m faster than target</span>
            </div>
          </div>
          <div className="pt-1 border-t border-surface-container text-[10px] text-on-surface-variant flex justify-between font-mono">
            <span>Target: 15.0m</span>
            <span className="font-bold text-primary">97.4% on-time</span>
          </div>
        </div>

        {/* Guest Taste Rating */}
        <div className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
              GUEST TASTE RATING
            </span>
            <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-on-surface font-mono">4.9</span>
              <span className="text-amber-500 font-bold text-sm">★★★★★</span>
              <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-mono font-bold">
                +0.1 wk
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium pt-0.5">
              950+ verified patron ratings
            </p>
          </div>
          <div className="pt-1 border-t border-surface-container text-[10px] text-on-surface-variant flex justify-between font-mono">
            <span>Overall Sentiment</span>
            <span className="font-bold text-emerald-700">99.1% Pos.</span>
          </div>
        </div>

        {/* Next Payout */}
        <div className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
              NEXT PAYOUT
            </span>
            <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-mono text-[10px] font-bold">
              FRI OCT 25
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-on-surface font-mono">₹14,210.80</span>
            <p className="text-[11px] text-on-surface-variant font-medium pt-0.5">
              HDFC Business (..8829)
            </p>
          </div>
          <div className="pt-1 border-t border-surface-container text-[10px] text-on-surface-variant flex justify-between font-mono">
            <span>Status</span>
            <span className="font-bold text-primary">● Auto-clearing</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Flow & Dish Velocity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hourly Order Flow & Line Congestion Chart */}
          <div className="bg-white rounded-xl p-5 border border-surface-container shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-on-surface">Hourly Order Flow & Line Congestion</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant pt-0.5">
                  Dual-peak analysis showing tickets processed vs line throttle ceiling (30 orders/hr)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
                  <span>Lunch / Dinner Rush</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-400"></span>
                  <span>Max Line Speed (30/hr)</span>
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-48 w-full relative flex items-end justify-between pt-6 px-2 border-b border-surface-container pb-2">
              {/* Max Ceiling Reference Line */}
              <div className="absolute top-12 left-0 right-0 border-b-2 border-dashed border-red-300 pointer-events-none flex justify-end">
                <span className="text-[9px] font-mono text-red-500 font-bold bg-white px-1 -translate-y-2">
                  CAPACITY LIMIT: 30/HR
                </span>
              </div>

              {[
                { time: '08:00', orders: 8, isPeak: false },
                { time: '09:30', orders: 14, isPeak: false },
                { time: '11:00', orders: 20, isPeak: false },
                { time: '12:00', orders: 28, isPeak: true, label: 'LUNCH PEAK' },
                { time: '13:00', orders: 26, isPeak: true },
                { time: '14:30', orders: 15, isPeak: false },
                { time: '16:00', orders: 11, isPeak: false },
                { time: '18:00', orders: 24, isPeak: false },
                { time: '19:30', orders: 34, isPeak: true, label: 'DINNER PEAK (OVERFLOW)' },
                { time: '20:30', orders: 31, isPeak: true },
                { time: '22:00', orders: 18, isPeak: false },
                { time: '23:00', orders: 9, isPeak: false },
              ].map((b, i) => {
                const heightPct = Math.min(100, Math.round((b.orders / 36) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <span className="text-[10px] font-mono font-bold text-on-surface opacity-0 group-hover:opacity-100 transition">
                      {b.orders}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 ${
                        b.isPeak
                          ? 'bg-gradient-to-t from-secondary to-secondary-container shadow-sm'
                          : 'bg-primary/30 group-hover:bg-primary transition'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-on-surface-variant">{b.time}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-2 bg-surface-container-low rounded-lg">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant block font-bold">
                  LUNCH PEAK THROUGHPUT
                </span>
                <span className="font-bold text-on-surface font-mono">28 Orders / Hr (12:45)</span>
              </div>
              <div className="p-2 bg-surface-container-low rounded-lg">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant block font-bold">
                  DINNER RUSH STRAIN
                </span>
                <span className="font-bold text-secondary font-mono">34 Orders / Hr (19:30)</span>
              </div>
              <div className="p-2 bg-surface-container-low rounded-lg">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant block font-bold">
                  AUTO-BALANCE ALERT
                </span>
                <span className="font-bold text-primary font-mono">Station 2 Rebalanced</span>
              </div>
            </div>
          </div>

          {/* Dish Velocity & Line Performance Table */}
          <div className="bg-white rounded-xl p-5 border border-surface-container shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Dish Velocity & Line Performance</h3>
                <p className="text-[11px] text-on-surface-variant pt-0.5">
                  Ranked ticket volume, gross contribution, and line preparation efficiency
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[11px] font-bold">
                LIVE ORDER LOG
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-container text-[10px] font-mono uppercase text-on-surface-variant">
                    <th className="pb-2 font-bold">Rank & Menu Item</th>
                    <th className="pb-2 font-bold text-center">Volume</th>
                    <th className="pb-2 font-bold text-right">Rev. Share</th>
                    <th className="pb-2 font-bold text-center">Avg Prep</th>
                    <th className="pb-2 font-bold text-right">Line Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container/60">
                  {[
                    {
                      rank: 1,
                      name: 'Green Goddess Celery & Apple Detox',
                      sub: 'Cold-Pressed Botanical Elixir',
                      volume: '54 bottles',
                      rev: '₹13,446.00',
                      share: '37.0%',
                      prep: '11.4 min',
                      status: 'Optimal',
                      statusColor: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      rank: 2,
                      name: 'Alphonso Mango & Chia Seed Thick Shake',
                      sub: 'Organic Ratnagiri Mango Blend',
                      volume: '38 shakes',
                      rev: '₹10,602.00',
                      share: '24.0%',
                      prep: '13.8 min',
                      status: 'Steady',
                      statusColor: 'bg-slate-100 text-slate-800',
                    },
                    {
                      rank: 3,
                      name: 'Ruby Beetroot & Pomegranate Flush',
                      sub: 'Himalayan Rock Salt Infusion',
                      volume: '46 bottles',
                      rev: '₹11,914.00',
                      share: '15.3%',
                      prep: '6.5 min',
                      status: 'Fast Turn',
                      statusColor: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      rank: 4,
                      name: 'Raw Cacao & Almond Butter Protein Shake',
                      sub: '25g Ceremonial Plant Protein',
                      volume: '22 shakes',
                      rev: '₹7,238.00',
                      share: '8.5%',
                      prep: '9.1 min',
                      status: 'Steady',
                      statusColor: 'bg-slate-100 text-slate-800',
                    },
                  ].map((d) => (
                    <tr key={d.rank} className="hover:bg-surface-container-low transition">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded bg-surface-container flex items-center justify-center font-bold font-mono text-[11px] text-on-surface">
                            {d.rank}
                          </span>
                          <div>
                            <span className="font-bold text-on-surface block leading-tight">{d.name}</span>
                            <span className="text-[10px] text-on-surface-variant font-medium">{d.sub}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono font-medium text-on-surface">
                        {d.volume}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-on-surface">
                        {d.rev}
                        <span className="block text-[10px] text-on-surface-variant font-normal">
                          {d.share}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-primary">
                        {d.prep}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${d.statusColor}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Courier Telemetry, Feedback, Settlement */}
        <div className="lg:col-span-5 space-y-6">
          {/* Courier Pass-Through Telemetry */}
          <div className="bg-white rounded-xl p-5 border border-surface-container shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-secondary" />
                <h3 className="font-bold text-sm text-on-surface">Courier Pass-Through Telemetry</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                96% SYNC
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Expeditor pass sync and thermal handover efficiency
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-on-surface-variant block">
                  DRIVER WAIT AT COUNTER
                </span>
                <span className="text-xl font-black text-on-surface font-mono">1.8</span>
                <span className="text-xs text-on-surface-variant font-medium ml-1">min</span>
                <span className="text-[10px] text-emerald-700 font-semibold block pt-0.5">
                  👍 Top 5% of Ghost Hubs
                </span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-on-surface-variant block">
                  BAGGED BEFORE ARRIVAL
                </span>
                <span className="text-xl font-black text-on-surface font-mono">92.4%</span>
                <span className="text-[10px] text-primary font-semibold block pt-0.5">
                  ✓ Zero thermal loss
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-surface-container text-xs">
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-on-surface">#ORD-8942</span>
                <span className="text-on-surface-variant text-[11px]">DoorDash • Alex K.</span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Handed off in 45s</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-on-surface">#ORD-8939</span>
                <span className="text-on-surface-variant text-[11px]">UberEats • Daniel M.</span>
                <span className="text-[10px] text-secondary font-mono font-bold">Driver early (+2m wait)</span>
              </div>
            </div>
          </div>

          {/* Kitchen Feedback Loop */}
          <div className="bg-white rounded-xl p-5 border border-surface-container shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Kitchen Feedback Loop</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">98.4% CSAT</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Real-time patron sentiments extracted from order ratings
            </p>

            {/* Sentiment Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                🌱 Fresh cold-pressed taste (142 mentions)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                🔒 Spill-proof packaging (85)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                ⚡ Extra mint leaves (12)
              </span>
            </div>

            {/* Customer Review Snippets */}
            <div className="space-y-2 pt-2 border-t border-surface-container">
              <div className="p-3 rounded-xl bg-surface-container-low space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 text-xs font-bold">★★★★★</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Today 13:42 • Green Goddess</span>
                </div>
                <p className="text-[11px] text-on-surface italic leading-snug">
                  &quot;The celery and ginger ratio was exquisite! Delivered ice-cold in under 20 mins. Will order daily.&quot;
                </p>
                <span className="text-[10px] text-on-surface-variant font-medium block">
                  — Sarah M., Verified Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Ledger & Deductions Breakdown */}
          <div className="bg-white rounded-xl p-5 border border-surface-container shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Settlement Ledger & Deductions</h3>
              </div>
              <span className="text-[10px] font-mono text-primary font-bold hover:underline cursor-pointer">
                VIEW TAX INVOICES
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Automated accounting, platform commission breakdown, and net transfers
            </p>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-on-surface font-medium">Gross Sales (Oct 14 - Oct 20)</span>
                <span className="font-mono font-bold text-on-surface">₹17,640.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container text-red-600">
                <span>Platform Fee (15.0%)</span>
                <span className="font-mono font-bold">-₹2,646.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container text-red-600">
                <span>Driver Courier Network Subsidy</span>
                <span className="font-mono font-bold">-₹382.40</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container text-red-600">
                <span>Sales Tax Remitted Directly to State (5% GST)</span>
                <span className="font-mono font-bold">-₹1,411.20</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container text-emerald-700">
                <span>Promotional Co-op Boost (Marketing Rebate)</span>
                <span className="font-mono font-bold">+₹1,010.40</span>
              </div>
              <div className="flex justify-between py-2 bg-surface-container-low px-3 rounded-lg font-bold text-sm">
                <span className="text-on-surface">Net Payout to Checking</span>
                <span className="font-mono text-primary">₹14,210.80</span>
              </div>
            </div>

            {/* Payout Statement Downloads */}
            <div className="space-y-1.5 pt-2">
              <div
                onClick={handleExportCSV}
                className="p-2.5 rounded-lg border border-surface-container hover:bg-surface-container-low transition flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">Payout Statement #CRV-2026-W41</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">Oct 07 - Oct 15 • Deposited ₹15,890.15</span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-on-surface-variant" />
              </div>

              <div
                onClick={handleExportCSV}
                className="p-2.5 rounded-lg border border-surface-container hover:bg-surface-container-low transition flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">Payout Statement #CRV-2026-W40</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">Sep 30 - Oct 06 • Deposited ₹12,940.50</span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-on-surface-variant" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POS Kitchen Cloud Status Footer */}
      <footer className="p-4 bg-white rounded-xl border border-surface-container shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-semibold text-on-surface">POS Kitchen Cloud Connected</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Ticket Printing Station: <strong>Active (Thermal 80mm)</strong></span>
          <span>Reconciliation Gateway: <strong>Chase Merchant Services</strong></span>
          <span>STATION ID: <strong>BHOPAL-KDS-01</strong></span>
          <span>APP V4.8.2</span>
        </div>
      </footer>
    </div>
  );
}
