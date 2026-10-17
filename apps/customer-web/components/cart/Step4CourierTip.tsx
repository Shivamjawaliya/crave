'use client';

import React from 'react';
import { HeartHandshake } from 'lucide-react';

interface Step4CourierTipProps {
  subtotal: number;
  selectedTipPercent: number;
  setSelectedTipPercent: (pct: number) => void;
  customTip: string;
  setCustomTip: (tip: string) => void;
}

export default function Step4CourierTip({
  subtotal,
  selectedTipPercent,
  setSelectedTipPercent,
  customTip,
  setCustomTip,
}: Step4CourierTipProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
            4
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Courier Tip</h3>
            <span className="text-xs text-slate-500">Support your dedicated driver</span>
          </div>
        </div>

        <span className="text-xs font-bold text-[#ab2f00] flex items-center gap-1">
          <HeartHandshake className="w-4 h-4" />
          <span>100% directly to courier</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[15, 18, 20].map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => {
              setSelectedTipPercent(pct);
              setCustomTip('');
            }}
            className={`py-3 rounded-2xl border text-center transition ${
              selectedTipPercent === pct && !customTip
                ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <strong className="text-xs block font-black">{pct}%</strong>
            <span className="text-[11px] block opacity-90">
              ${((subtotal * pct) / 100).toFixed(2)}
            </span>
          </button>
        ))}

        <div
          className={`py-2 px-3 rounded-2xl border flex flex-col justify-center text-center ${
            customTip ? 'border-[#ab2f00] bg-[#fff5f2]' : 'border-slate-200 bg-white'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase">Custom</span>
          <input
            type="number"
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            placeholder="$0.00"
            className="w-full text-center text-xs font-bold outline-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
