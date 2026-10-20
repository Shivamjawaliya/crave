'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronRight, X, Bike, ShoppingBag } from 'lucide-react';
import { useOrderStore } from '../lib/order.store';
import { useCartStore } from '../lib/store';

export default function ActiveOrderFloatingBanner() {
  const pathname = usePathname();
  const {
    activeOrder,
    isBannerDismissed,
    dismissBanner,
    hydrateFromStorage: hydrateOrder,
  } = useOrderStore();

  const {
    items: cartItems,
    restaurantId: cartRestaurantId,
    restaurantName: cartRestaurantName,
    clearCart,
    getSubtotalPaise,
    hydrateFromStorage: hydrateCart,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCartDismissed, setIsCartDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrateOrder();
    hydrateCart();
  }, [hydrateOrder, hydrateCart]);

  // Don't display on tracking or cart/checkout pages
  if (
    !mounted ||
    pathname?.startsWith('/orders/track') ||
    pathname === '/cart'
  ) {
    return null;
  }

  const hasActiveOrder = !!activeOrder && !isBannerDismissed;
  const hasCart = cartItems.length > 0 && !isCartDismissed;

  // Nothing to show if neither exists
  if (!hasActiveOrder && !hasCart) {
    return null;
  }

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalCardsCount = (hasActiveOrder ? 1 : 0) + (hasCart ? 1 : 0);
  const showAllToggle = totalCardsCount > 1;

  // Active Order Card Element (Matching Crave UI theme)
  const renderActiveOrderCard = () => {
    if (!activeOrder) return null;
    return (
      <div className="relative bg-[#161c23]/95 backdrop-blur-xl text-white p-2.5 sm:p-3 rounded-full shadow-[0_12px_36px_rgba(22,28,35,0.45)] border border-[#ab2f00]/30 flex items-center justify-between gap-2.5 sm:gap-3 transition-all">
        {/* Left: Thumbnail & Info */}
        <Link
          href="/orders/track"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 group"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/15 ring-2 ring-[#ab2f00]/30">
            <img
              src={
                activeOrder.items?.[0]?.imageUrl ||
                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80'
              }
              alt={activeOrder.restaurantName}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ab2f00] text-white flex items-center justify-center ring-2 ring-[#161c23]">
              <Bike className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ffdbd1] transition">
              {activeOrder.restaurantName}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-[#ffdbd1] font-semibold">
              <span>Track Order</span>
              <ChevronRight className="w-3 h-3 text-[#ffdbd1]" />
            </div>
          </div>
        </Link>

        {/* Right: View Order Button & Dismiss 'X' */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/orders/track"
            className="rounded-full bg-gradient-to-r from-[#ab2f00] to-[#d53e02] hover:from-[#8f2700] hover:to-[#b83500] text-white px-3.5 sm:px-4 py-1.5 text-center flex flex-col justify-center items-center shadow-md shadow-[#ab2f00]/30 active:scale-95 transition"
          >
            <span className="text-xs font-black tracking-tight leading-none">View Order</span>
            <span className="text-[10px] text-orange-100 font-medium leading-none pt-0.5">
              {activeOrder.etaMinutes}
            </span>
          </Link>

          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss active order bar"
            className="w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Cart Card Element (Exact match with screenshot a11bd575)
  const renderCartCard = () => {
    if (!hasCart) return null;
    const cartImg =
      cartItems[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80';
    const cartSubtotal = (getSubtotalPaise() / 100).toFixed(0);

    return (
      <div className="relative bg-[#161c23]/95 backdrop-blur-xl text-white p-2.5 sm:p-3 rounded-full shadow-[0_12px_36px_rgba(22,28,35,0.45)] border border-[#ab2f00]/30 flex items-center justify-between gap-2.5 sm:gap-3 transition-all">
        {/* Left: Thumbnail & Info (Clickable link to cart) */}
        <Link
          href="/cart"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 group"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/15 ring-2 ring-[#ab2f00]/30">
            <img
              src={cartImg}
              alt={cartRestaurantName || 'Restaurant'}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ab2f00] text-white flex items-center justify-center ring-2 ring-[#161c23]">
              <ShoppingBag className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ffdbd1] transition">
              {cartRestaurantName || 'Your Cart'}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-[#ffdbd1] font-semibold">
              <span>View Cart</span>
              <ChevronRight className="w-3 h-3 text-[#ffdbd1]" />
            </div>
          </div>
        </Link>

        {/* Right: View Cart Button & Clear 'X' */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/cart"
            className="rounded-full bg-gradient-to-r from-[#ab2f00] to-[#d53e02] hover:from-[#8f2700] hover:to-[#b83500] text-white px-3.5 sm:px-4 py-1.5 text-center flex flex-col justify-center items-center shadow-md shadow-[#ab2f00]/30 active:scale-95 transition"
          >
            <span className="text-xs font-black tracking-tight leading-none">View Cart</span>
            <span className="text-[10px] text-orange-100 font-medium leading-none pt-0.5">
              {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} • ₹{cartSubtotal}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              clearCart();
              setIsCartDismissed(true);
            }}
            aria-label="Clear cart"
            className="w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay when expanded on mobile */}
      {isExpanded && showAllToggle && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Floating Pill Container (Shifted upward to avoid touching mobile bottom nav) */}
      <div className="fixed bottom-[82px] sm:bottom-8 inset-x-3.5 sm:inset-x-auto sm:right-6 z-40 sm:max-w-md w-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="relative">
          {/* "All ▲" / "All ▼" toggle badge when both active order & cart exist */}
          {showAllToggle && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#161c23] text-[#ffdbd1] text-[11px] font-bold px-3 py-0.5 rounded-full shadow-lg border border-[#ab2f00]/40 flex items-center gap-1 hover:bg-[#222a33] active:scale-95 transition-all cursor-pointer z-10"
            >
              <span>All</span>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#ffdbd1]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#ffdbd1]" />
              )}
            </button>
          )}

          {/* List of cards */}
          {isExpanded ? (
            /* Expanded Stack (Screenshot 3): Active Order on top, Cart on bottom */
            <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {hasActiveOrder && renderActiveOrderCard()}
              {hasCart && renderCartCard()}
            </div>
          ) : (
            /* Collapsed Single View: Active Order takes priority, else Cart */
            <div>
              {hasActiveOrder ? renderActiveOrderCard() : renderCartCard()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
