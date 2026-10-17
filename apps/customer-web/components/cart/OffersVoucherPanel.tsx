'use client';

import React from 'react';
import { Tag, Check, X } from 'lucide-react';

interface OffersVoucherPanelProps {
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  voucherApplied: boolean;
  setVoucherApplied: (applied: boolean) => void;
  handleApplyVoucher: (e: React.FormEvent) => void;
}

export default function OffersVoucherPanel({
  voucherCode,
  setVoucherCode,
  voucherApplied,
  setVoucherApplied,
  handleApplyVoucher,
}: OffersVoucherPanelProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
      <h3 className="text-base font-black text-slate-900">Offers & Vouchers</h3>

      <form onSubmit={handleApplyVoucher} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="Enter coupon or gift card code (try SAVOR10)"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#ab2f00] outline-none"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
        >
          Apply
        </button>
      </form>

      {voucherApplied && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#006c49]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#006c49]" />
            <span>SAVOR10 applied — $5.00 off order</span>
          </div>
          <button
            type="button"
            onClick={() => setVoucherApplied(false)}
            className="text-slate-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
