'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { UserAddress } from '../../lib/address.store';
import { DropoffMode } from './types';

interface Step1DeliveryAddressProps {
  selectedAddress: UserAddress;
  openAddressModal: () => void;
  dropoffMode: DropoffMode;
  setDropoffMode: (mode: DropoffMode) => void;
  callboxCode: string;
  setCallboxCode: (code: string) => void;
  instructions: string;
  setInstructions: (text: string) => void;
}

export default function Step1DeliveryAddress({
  selectedAddress,
  openAddressModal,
  dropoffMode,
  setDropoffMode,
  callboxCode,
  setCallboxCode,
  instructions,
  setInstructions,
}: Step1DeliveryAddressProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
            1
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Delivery Address & Drop-off
            </h3>
            <span className="text-xs text-slate-500">Confirmed delivery destination</span>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddressModal}
          className="text-xs font-bold text-[#ab2f00] hover:underline cursor-pointer"
        >
          Edit
        </button>
      </div>

      {/* Address Box */}
      <div
        onClick={openAddressModal}
        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:border-[#ab2f00]/50 transition group"
      >
        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#ab2f00] shrink-0 mt-0.5 group-hover:bg-[#ffdbd1] transition-colors">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-900">
              {selectedAddress.label || 'Home'}
            </span>
            {selectedAddress.isDefault && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 font-semibold pt-0.5">
            {selectedAddress.addressLine}
          </p>
          <p className="text-[11px] text-slate-500">
            {[selectedAddress.city, selectedAddress.state].filter(Boolean).join(', ')}{' '}
            {selectedAddress.pincode} • Intercom available
          </p>
        </div>
      </div>

      {/* Drop-off Preference */}
      <div className="space-y-3">
        <span className="text-xs font-extrabold text-slate-900 block">
          Drop-off Preference
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDropoffMode('meet')}
            className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              dropoffMode === 'meet'
                ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>👤 Meet at door</span>
          </button>

          <button
            type="button"
            onClick={() => setDropoffMode('leave')}
            className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              dropoffMode === 'leave'
                ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🚪 Leave at door</span>
          </button>
        </div>

        {/* Callbox Code & Instructions */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="font-bold">Building callbox code:</span>
            <input
              type="text"
              value={callboxCode}
              onChange={(e) => setCallboxCode(e.target.value)}
              className="w-20 bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[#ab2f00] font-bold"
            />
          </div>

          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Special instructions for courier..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#ab2f00] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
