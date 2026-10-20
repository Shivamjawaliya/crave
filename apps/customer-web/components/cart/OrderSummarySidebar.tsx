'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Plus, Minus, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center font-serif font-black text-xl shrink-0 overflow-hidden shadow-sm">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0gLTU7FbC7LuGE-EhzeWl9KnanXFOn5Yk8PyBcf4rsGiEHUqaCIoBaipXdLgx7GoCoQuyiCVR18mKhcGh3lTZaLaqdTY_coCm4C3FBtkgnGfogAV__t8wndU3dbmgVBaX8wObRWzdnryPHfkINirrXFs_l9irhHwRbVls46x5MFrZhRyzFVkpc_A_CdqxlmmvfVGB72q968Mx4flh0WJh5Q1l1WShqlg0XyCP4wBFumVoWFYfoZ0R"
                alt="Umai Handcrafted Ramen"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                  {restaurantName || 'Umai Handcrafted Ramen'}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
                <span>Artisanal Broths • {cartItems.length} Items</span>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-[#ab2f00] hover:underline shrink-0"
          >
            Edit
          </Link>
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
                    <span className="font-extrabold text-[#ab2f00]">{item.quantity}×</span>
                    <h5 className="font-bold text-slate-900 truncate">{item.name}</h5>
                  </div>
                  <span className="text-slate-500 text-[11px] block leading-tight">
                    {item.subtitle || 'Prepared fresh upon placement'}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900">
                    ₹{((item.pricePaise * item.quantity) / 100).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
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
            <div className="py-8 text-center space-y-1.5 text-slate-400">
              <p className="text-xs font-bold text-slate-700">Your cart is empty</p>
              <p className="text-[11px] text-slate-500">Add dishes from a restaurant menu to checkout.</p>
            </div>
          )}
        </div>

        {/* Calculations Breakdown */}
        <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
          </div>

          {voucherApplied && (
            <div className="flex justify-between text-[#006c49] font-bold">
              <span>Promotion Applied (SAVOR10)</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-bold text-slate-900">
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Taxes &amp; Estimated Fees</span>
            <span className="font-bold text-slate-900">₹{taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Courier Tip</span>
            <span className="font-bold text-slate-900">₹{tipAmount.toFixed(2)}</span>
          </div>

          {applyCraveCash && (
            <div className="flex justify-between text-[#ab2f00] font-bold">
              <span>Crave Cash Applied</span>
              <span>-₹{craveCashDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-baseline justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
            <div>
              <span className="block leading-none font-bold">Total</span>
              <span className="text-[10px] font-normal text-slate-400 block pt-1">
                Includes all taxes and surcharges
              </span>
            </div>
            <span className="text-2xl font-black text-[#ab2f00]">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Desktop Primary Action inside sticky card */}
        <div className="hidden lg:block space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
              <span>Direct Dispatch Route</span>
            </span>
            <span className="text-[#006c49] font-bold">Kitchen Ready in ~12m</span>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || cartItems.length === 0}
            className={`w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition active:scale-[0.99] ${
              cartItems.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : isPlacingOrder
                ? 'bg-[#ab2f00]/70 text-white cursor-wait'
                : 'bg-[#ab2f00] hover:bg-[#8f2700] text-white shadow-xl shadow-[#ab2f00]/30'
            }`}
          >
            {isPlacingOrder ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Broadcasting to Kitchen via RabbitMQ...</span>
              </>
            ) : cartItems.length === 0 ? (
              <span>Your Cart is Empty</span>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 shrink-0" />
                <span>Place Order • ₹{totalAmount.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>

        {/* Trust badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold text-center">
          <ShieldCheck className="w-4 h-4 text-[#006c49]" />
          <span>Guaranteed Safe Checkout • 256-bit SSL Bank-Grade Encryption</span>
        </div>

        {/* Fresh-Pack Guarantee */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-[11px] text-slate-700">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[#006c49] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-[#006c49]" />
          </div>
          <div>
            <h5 className="font-bold text-slate-900">Fresh-Pack Thermal Guarantee</h5>
            <p className="text-slate-500 text-[11px] leading-snug">
              Sealed kitchen-side in insulated heat packs. Temperature guaranteed or instant credit.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Place Order Bottom Bar (Matching Stitch Mobile Checkout) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-safe">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
                <span>Direct Dispatch Route</span>
              </span>
              <span className="text-[#006c49] font-bold">Kitchen Ready in ~12m</span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className={`w-full py-3.5 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                isPlacingOrder
                  ? 'bg-[#ab2f00]/70 text-white cursor-wait'
                  : 'bg-[#ab2f00] hover:bg-[#8f2700] text-white shadow-[#ab2f00]/30'
              }`}
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 shrink-0" />
                  <span>Place Order • ₹{totalAmount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
