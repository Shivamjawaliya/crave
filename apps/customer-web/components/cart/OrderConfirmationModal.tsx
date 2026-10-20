'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { UserAddress } from '../../lib/address.store';

interface OrderConfirmationModalProps {
  orderSuccess: boolean;
  placedOrderNumber: string;
  selectedAddress: UserAddress;
}

export default function OrderConfirmationModal({
  orderSuccess,
  placedOrderNumber,
  selectedAddress,
}: OrderConfirmationModalProps) {
  if (!orderSuccess) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-md w-full p-8 text-center space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c49] flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#ab2f00] bg-[#ffdbd1] px-3 py-1 rounded-full">
            ORDER CONFIRMED
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Kitchen is preparing your feast!
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Your order <strong className="text-slate-900 font-mono">#{placedOrderNumber}</strong> has been transmitted to the executive kitchen line.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Estimated Arrival</span>
            <span className="font-extrabold text-[#006c49]">20–30 mins</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Delivery Address</span>
            <span className="font-bold text-slate-800 truncate max-w-[200px]">
              {selectedAddress?.addressLine || 'd/2 Nehru nagar, Bhopal, Madhya Pradesh 462001'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Payment Mode</span>
            <span className="font-bold text-slate-800">Visa ending in 4242</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href="/orders/track"
            className="w-full py-3.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ab2f00]/30 transition"
          >
            <span>Track Live Delivery</span>
            <span>→</span>
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
