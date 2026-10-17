'use client';

import React from 'react';
import { Star, Plus, Minus, ShieldCheck, Sparkles } from 'lucide-react';
import { CartItem } from '../../lib/store';

interface OrderSummarySidebarProps {
  restaurantName: string | null;
  cartItems: CartItem[];
  updateQuantity: (menuItemId: string, delta: number) => void;
  subtotal: number;
  discount: number;
  voucherApplied: boolean;
  deliveryFee: number;
  platformFee: number;
  selectedTipPercent: number;
  tipAmount: number;
  taxAmount: number;
  applyCraveCash: boolean;
  craveCashDiscount: number;
  totalAmount: number;
  isPlacingOrder: boolean;
  handlePlaceOrder: () => void;
}

export default function OrderSummarySidebar({
  restaurantName,
  cartItems,
  updateQuantity,
  subtotal,
  discount,
  voucherApplied,
  deliveryFee,
  platformFee,
  selectedTipPercent,
  tipAmount,
  taxAmount,
  applyCraveCash,
  craveCashDiscount,
  totalAmount,
  isPlacingOrder,
  handlePlaceOrder,
}: OrderSummarySidebarProps) {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl space-y-6">
        {/* Restaurant Badge */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center font-serif font-black text-xl shrink-0">
            {restaurantName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                {restaurantName || 'Umai Handcrafted Ramen'}
              </h4>
              <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Artisan
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
              <span className="flex items-center text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" /> 4.9
              </span>
              <span>• (503) 555-8291</span>
            </div>
          </div>
        </div>

        {/* Itemized Order List */}
        <div className="space-y-4 max-h-72 overflow-y-auto no-scrollbar">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#ab2f00]">{item.quantity}x</span>
                    <h5 className="font-bold text-slate-900 truncate">{item.name}</h5>
                  </div>
                  <span className="text-slate-500 text-[11px] block">
                    Prepared fresh upon placement
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900">
                    ₹{((item.pricePaise * item.quantity) / 100).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Default Preview Items matching Juiy / Fresh Kitchen */
            <>
              <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#ab2f00]">1x</span>
                    <h5 className="font-bold text-slate-900">Valencia Orange & Ginger Immunity Elixir</h5>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    Fresh cold-pressed Valencia oranges, organic ginger root
                  </span>
                </div>
                <span className="font-extrabold text-slate-900">₹229.00</span>
              </div>

              <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#ab2f00]">1x</span>
                    <h5 className="font-bold text-slate-900">Alphonso Mango & Chia Seed Thick Shake</h5>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    Pure Ratnagiri Alphonso pulp, organic chia seeds
                  </span>
                </div>
                <span className="font-extrabold text-slate-900">₹279.00</span>
              </div>
            </>
          )}
        </div>

        {/* Calculations Breakdown */}
        <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex justify-between">
            <span>Subtotal ({cartItems.length > 0 ? cartItems.length : 2} items)</span>
            <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
          </div>

          {voucherApplied && (
            <div className="flex justify-between text-[#006c49] font-bold">
              <span>SAVOR10 Promo</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-bold text-slate-900">₹{deliveryFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Service & Platform Fee</span>
            <span className="font-bold text-slate-900">₹{platformFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Courier Tip ({selectedTipPercent}%)</span>
            <span className="font-bold text-slate-900">₹{tipAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Estimated Taxes (5% GST)</span>
            <span className="font-bold text-slate-900">₹{taxAmount.toFixed(2)}</span>
          </div>

          {applyCraveCash && (
            <div className="flex justify-between text-[#ab2f00] font-bold">
              <span>Crave Cash Applied</span>
              <span>-₹{craveCashDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-baseline justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
            <div>
              <span className="block leading-none">Total Amount</span>
              <span className="text-[10px] font-normal text-slate-400 block pt-1">
                Includes GST, delivery & tip
              </span>
            </div>
            <span className="text-2xl font-black text-[#ab2f00]">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Place Order Primary Action */}
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="w-full py-4 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ab2f00]/30 transition disabled:opacity-50"
        >
          {isPlacingOrder ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Broadcasting to Kitchen via RabbitMQ...</span>
            </>
          ) : (
            <>
              <span>Place Order • ₹{totalAmount.toFixed(2)}</span>
              <span>→</span>
            </>
          )}
        </button>

        {/* Trust badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold text-center">
          <ShieldCheck className="w-4 h-4 text-[#006c49]" />
          <span>Guaranteed Safe Checkout • 256-bit SSL Bank-Grade Encryption</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-[11px] text-slate-700">
          <Sparkles className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
          <span>
            <strong>Fresh-Pack Guarantee:</strong> Noodles & broth separated for guaranteed thermal texture integrity.
          </span>
        </div>
      </div>
    </div>
  );
}
