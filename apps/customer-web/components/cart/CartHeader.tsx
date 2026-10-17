'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, MapPin, ArrowLeft, Lock } from 'lucide-react';
import NavbarAuth from '../NavbarAuth';
import { UserAddress } from '../../lib/address.store';

interface CartHeaderProps {
  selectedAddress: UserAddress;
  openAddressModal: () => void;
}

export default function CartHeader({
  selectedAddress,
  openAddressModal,
}: CartHeaderProps) {
  return (
    <>
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#f7f9ff]/95 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.04)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <span className="font-serif font-black text-2xl tracking-tight text-[#161c23]">
                Crave
              </span>
            </Link>

            <button
              type="button"
              onClick={openAddressModal}
              className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 hover:opacity-80 transition text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00] group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Deliver to
                </span>
                <span className="text-xs font-bold text-[#161c23] truncate max-w-[170px]">
                  {selectedAddress.addressLine} ▾
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
            <Link href="/" className="hover:text-[#ab2f00] transition">Offers</Link>
            <Link href="/orders" className="hover:text-[#ab2f00] transition">Past Orders</Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* 2. SUBHEADER: BREADCRUMB & SECURITY STATUS */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#ab2f00] flex items-center gap-1 font-bold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </Link>
            <span>•</span>
            <span className="text-slate-900 font-extrabold">Checkout Flow</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-bold text-[11px] border border-emerald-200">
            <Lock className="w-3 h-3 text-[#006c49]" />
            <span>End-to-End Encrypted Session</span>
          </div>
        </div>
      </div>
    </>
  );
}
