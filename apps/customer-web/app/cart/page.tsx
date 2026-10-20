'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import { useCheckout } from '../../hooks/useCheckout';
import CartHeader from '../../components/cart/CartHeader';
import Step1DeliveryAddress from '../../components/cart/Step1DeliveryAddress';
import Step2DeliverySpeed from '../../components/cart/Step2DeliverySpeed';
import Step3PaymentMethod from '../../components/cart/Step3PaymentMethod';
import Step4CourierTip from '../../components/cart/Step4CourierTip';
import OffersVoucherPanel from '../../components/cart/OffersVoucherPanel';
import OrderSummarySidebar from '../../components/cart/OrderSummarySidebar';
import OrderConfirmationModal from '../../components/cart/OrderConfirmationModal';
import AddressModal from '../../components/AddressModal';

export default function CartCheckoutPage() {
  const checkout = useCheckout();

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* 1. Top Header & Breadcrumb Security Subheader */}
      <CartHeader
        selectedAddress={checkout.selectedAddress}
        openAddressModal={checkout.openAddressModal}
      />

      {/* 2. Order Confirmation Modal Popup */}
      <OrderConfirmationModal
        orderSuccess={checkout.orderSuccess}
        placedOrderNumber={checkout.placedOrderNumber}
        selectedAddress={checkout.selectedAddress}
      />

      {/* 3. Empty Cart View or Stepped Checkout Grid */}
      {checkout.cartItems.length === 0 ? (
        <main className="max-w-[700px] mx-auto px-4 py-20 flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#ffdbd1]/60 text-[#ab2f00] flex items-center justify-center mx-auto shadow-inner">
              <ShoppingBag className="w-12 h-12" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h1 className="text-2xl sm:text-3xl font-black text-[#161c23] tracking-tight">
              Your cart is empty
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              You haven&apos;t added any items to your cart yet. Explore our curated kitchens, browse signature dishes, and order your favorites!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={checkout.populateDemoItems}
              className="px-6 py-3.5 rounded-full bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-lg shadow-[#ab2f00]/30 flex items-center gap-2 transition group cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Load Stitch Demo Feast (Umai Ramen)</span>
            </button>
            <Link
              href="/"
              className="px-5 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
            >
              Explore Restaurants
            </Link>
          </div>
        </main>
      ) : (
        /* 3. Main Checkout Grid (when cart has items) */
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32 sm:pb-36 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 flex-1">
          {/* Left Column: 4 Stepped Panels & Vouchers */}
          <div className="lg:col-span-8 space-y-6">
            <Step1DeliveryAddress
              selectedAddress={checkout.selectedAddress}
              openAddressModal={checkout.openAddressModal}
              dropoffMode={checkout.dropoffMode}
              setDropoffMode={checkout.setDropoffMode}
              callboxCode={checkout.callboxCode}
              setCallboxCode={checkout.setCallboxCode}
              instructions={checkout.instructions}
              setInstructions={checkout.setInstructions}
            />

            <Step2DeliverySpeed
              deliverySpeed={checkout.deliverySpeed}
              setDeliverySpeed={checkout.setDeliverySpeed}
            />

            <Step3PaymentMethod
              paymentMethod={checkout.paymentMethod}
              setPaymentMethod={checkout.setPaymentMethod}
              applyCraveCash={checkout.applyCraveCash}
              setApplyCraveCash={checkout.setApplyCraveCash}
            />

            <Step4CourierTip
              subtotal={checkout.subtotal}
              selectedTipPercent={checkout.selectedTipPercent}
              setSelectedTipPercent={checkout.setSelectedTipPercent}
              customTip={checkout.customTip}
              setCustomTip={checkout.setCustomTip}
            />

            <OffersVoucherPanel
              voucherCode={checkout.voucherCode}
              setVoucherCode={checkout.setVoucherCode}
              voucherApplied={checkout.voucherApplied}
              setVoucherApplied={checkout.setVoucherApplied}
              handleApplyVoucher={checkout.handleApplyVoucher}
            />
          </div>

          {/* Right Column: Sticky Order Summary */}
          <OrderSummarySidebar
            restaurantName={checkout.restaurantName}
            cartItems={checkout.cartItems}
            updateQuantity={checkout.updateQuantity}
            subtotal={checkout.subtotal}
            discount={checkout.discount}
            voucherApplied={checkout.voucherApplied}
            deliveryFee={checkout.deliveryFee}
            platformFee={checkout.platformFee}
            selectedTipPercent={checkout.selectedTipPercent}
            tipAmount={checkout.tipAmount}
            taxAmount={checkout.taxAmount}
            applyCraveCash={checkout.applyCraveCash}
            craveCashDiscount={checkout.craveCashDiscount}
            totalAmount={checkout.totalAmount}
            isPlacingOrder={checkout.isPlacingOrder}
            handlePlaceOrder={checkout.handlePlaceOrder}
          />
        </main>
      )}

      {/* 4. Crave Footer */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-32 sm:pb-36 lg:pb-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Crave Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/orders" className="hover:underline">Past Orders</Link>
              <Link href="/login" className="hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
