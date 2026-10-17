'use client';

import React from 'react';
import { Plus, Check } from 'lucide-react';
import { PaymentMethod } from './types';

interface Step3PaymentMethodProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  applyCraveCash: boolean;
  setApplyCraveCash: (apply: boolean) => void;
}

export default function Step3PaymentMethod({
  paymentMethod,
  setPaymentMethod,
  applyCraveCash,
  setApplyCraveCash,
}: Step3PaymentMethodProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
            3
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Payment Method</h3>
            <span className="text-xs text-slate-500">Select express checkout or cards</span>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-bold text-[#ab2f00] hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Card</span>
        </button>
      </div>

      {/* Express Pay Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPaymentMethod('applepay')}
          className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition ${
            paymentMethod === 'applepay'
              ? 'bg-black text-white border-black'
              : 'bg-slate-900 text-white hover:bg-black'
          }`}
        >
          <span> Apple Pay</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod('googlepay')}
          className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition ${
            paymentMethod === 'googlepay'
              ? 'bg-slate-100 border-slate-400 text-slate-900'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>G Pay</span>
        </button>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          OR PAY WITH CARD
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* Saved Card Option */}
      <div
        onClick={() => setPaymentMethod('card')}
        className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
          paymentMethod === 'card'
            ? 'border-[#006c49] bg-emerald-50/40'
            : 'border-slate-200 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 rounded bg-[#1a1f71] text-white flex items-center justify-center font-bold text-[10px] tracking-wider">
            VISA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900">Visa ending in 4242</span>
              <span className="text-[10px] bg-emerald-100 text-[#006c49] font-bold px-2 py-0.5 rounded">
                Primary
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Expires 09/27 • Verified by Visa
            </span>
          </div>
        </div>

        <div className="w-5 h-5 rounded-full bg-[#006c49] text-white flex items-center justify-center">
          <Check className="w-3 h-3" />
        </div>
      </div>

      {/* Crave Cash Switcher */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-bold text-xs">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs text-slate-900">Apply Crave Cash</strong>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold">
                $12.50 available
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Automatically offset your total
            </span>
          </div>
        </div>

        <input
          type="checkbox"
          checked={applyCraveCash}
          onChange={(e) => setApplyCraveCash(e.target.checked)}
          className="w-5 h-5 rounded text-[#ab2f00] focus:ring-[#ab2f00]"
        />
      </div>
    </div>
  );
}
