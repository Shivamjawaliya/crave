'use client';

import React from 'react';
import { Sparkles, CheckCircle, IndianRupee, ArrowRight, ShieldCheck } from 'lucide-react';

interface TripCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout?: string;
}

export default function TripCelebrationModal({
  isOpen,
  onClose,
  payout = '₹65.00',
}: TripCelebrationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
          <Sparkles className="w-9 h-9 animate-bounce text-amber-500 fill-amber-400" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Trip Successfully Completed
          </span>
          <h2 className="text-2xl font-black text-slate-900 pt-1">
            Great job, Partner! 🎉
          </h2>
          <p className="text-xs text-slate-500">
            Order handed over safely and verified by customer.
          </p>
        </div>

        {/* Payout Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Trip Earnings
          </span>
          <div className="text-3xl font-black text-emerald-400 flex items-center justify-center">
            <span>{payout}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Base ₹35</span>
            <span>•</span>
            <span>Dist ₹20</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">Rush ₹10</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Credited instantly to your Daily Wallet</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
        >
          <span>CONTINUE & RETURN TO ONLINE POOL</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
