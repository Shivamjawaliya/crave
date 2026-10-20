'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Check,
  Flame,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export interface CustomizerDishItem {
  id: string;
  name: string;
  description: string | null;
  pricePaise?: number;
  price?: number;
  imageUrl: string | null;
}

export interface DishCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CustomizerDishItem | null;
  restaurantId?: string;
  restaurantName?: string;
  currencySymbol?: string; // '$' or '₹', defaults to '$' or '₹'
  isAcceptingOrders?: boolean;
  onAddToCart?: (result: {
    menuItemId: string;
    name: string;
    pricePaise: number;
    priceDisplay: string;
    imageUrl: string | null;
    customizationNotes: string;
    quantity: number;
  }) => void;
}

interface BrothOption {
  id: string;
  name: string;
  subtext?: string;
  priceModifier: number; // in base units ($ or converted paise)
}

interface AddonOption {
  id: string;
  name: string;
  subtext: string;
  price: number;
}

const BROTH_OPTIONS: BrothOption[] = [
  {
    id: 'rich',
    name: 'Rich Tonkotsu (Original)',
    priceModifier: 0,
  },
  {
    id: 'spicy',
    name: 'Spicy Miso',
    subtext: 'House fermented red chili blend',
    priceModifier: 0.75,
  },
  {
    id: 'shoyu',
    name: 'Roasted Garlic Shoyu',
    priceModifier: 0,
  },
];

const NOODLE_FIRMNESS = [
  { id: 'firm', label: 'Firm (Katame)' },
  { id: 'regular', label: 'Regular' },
  { id: 'soft', label: 'Soft' },
];

const ADDON_OPTIONS: AddonOption[] = [
  {
    id: 'egg',
    name: 'Ajitsuke Soft Egg',
    subtext: 'Marinated organic jammy yolk',
    price: 2.50,
  },
  {
    id: 'chashu',
    name: 'Extra Pork Chashu (2 pcs)',
    subtext: 'Torch-seared tender belly',
    price: 4.00,
  },
  {
    id: 'menma',
    name: 'Seasoned Menma Bamboo Shoots',
    subtext: 'House simmered crunch',
    price: 1.50,
  },
];

export default function DishCustomizerModal({
  isOpen,
  onClose,
  item,
  restaurantId = '',
  restaurantName = '',
  currencySymbol = '$',
  isAcceptingOrders = true,
  onAddToCart,
}: DishCustomizerModalProps) {
  const [selectedBroth, setSelectedBroth] = useState<string>('rich');
  const [selectedFirmness, setSelectedFirmness] = useState<string>('firm');
  // Matching Stitch screenshot default: Ajitsuke Soft Egg is checked by default
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['egg']);
  const [quantity, setQuantity] = useState<number>(1);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Reset state when opening a new item
  useEffect(() => {
    if (isOpen) {
      setSelectedBroth('rich');
      setSelectedFirmness('firm');
      setSelectedAddons(['egg']);
      setQuantity(1);
      setIsClosing(false);
    }
  }, [isOpen, item?.id]);

  // Determine base price
  const basePrice = useMemo(() => {
    if (!item) return 18.50;
    if (typeof item.price === 'number' && item.price > 0) return item.price;
    if (typeof item.pricePaise === 'number' && item.pricePaise > 0) {
      return item.pricePaise / 100;
    }
    return 18.50;
  }, [item]);

  // Calculate total single item price
  const singleItemPrice = useMemo(() => {
    const brothMod =
      BROTH_OPTIONS.find((b) => b.id === selectedBroth)?.priceModifier || 0;
    const addonsTotal = selectedAddons.reduce((sum, addonId) => {
      const match = ADDON_OPTIONS.find((a) => a.id === addonId);
      return sum + (match?.price || 0);
    }, 0);

    return basePrice + brothMod + addonsTotal;
  }, [basePrice, selectedBroth, selectedAddons]);

  const totalPrice = singleItemPrice * quantity;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (!item || !isAcceptingOrders) return;

    const brothObj = BROTH_OPTIONS.find((b) => b.id === selectedBroth);
    const firmnessObj = NOODLE_FIRMNESS.find((f) => f.id === selectedFirmness);
    const chosenAddonNames = selectedAddons
      .map((id) => ADDON_OPTIONS.find((a) => a.id === id)?.name)
      .filter(Boolean);

    const notes = [
      brothObj?.name,
      firmnessObj?.label,
      chosenAddonNames.length > 0 ? chosenAddonNames.join(', ') : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const finalPaise = Math.round(singleItemPrice * 100);

    if (onAddToCart) {
      onAddToCart({
        menuItemId: item.id,
        name: `${item.name} (${notes})`,
        pricePaise: finalPaise,
        priceDisplay: `${currencySymbol}${totalPrice.toFixed(2)}`,
        imageUrl: item.imageUrl,
        customizationNotes: notes,
        quantity,
      });
    }

    handleClose();
  };

  if (!isOpen || !item) return null;

  const fallbackImage =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDM6AKpSJSDbjj_OF3ryWK1zQCvi4VL3Bh1MoRDgDNaA_3H77f9a6Bvc5q5QUZHMimtOPqrnvSmh-HU3V8kbacLPBPB48bZuN00JHENKyKXLWF-I6VlHXsEoX9G3EbgGyQRbUsY7TNstyIKVzCIFhOmenp10rdD8m7_cEHCf7B_BKs6XUpoKue3IdWZtzEUTXTG9vka8PAHLpVGIjlo03_TGBVN6dC0y553BSVd6_be1QchdSGbHBNt';

  const dishImage = item.imageUrl || fallbackImage;
  const dishDescription =
    item.description ||
    'Handmade Hakata noodles nestled in a 24-hour slow-boiled pork bone collagen broth, infused with charred black garlic oil and shaved winter truffles.';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-customizer-title"
    >
      {/* Dimmer Scrim for Modal Presentation */}
      <div
        className="fixed inset-0 bg-[#161c23]/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Elevated Interactive Bottom Sheet Modal */}
      <div
        id="ramen-sheet"
        className={`relative z-50 w-full max-w-lg bg-[#ffffff] rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] transition-transform duration-300 ${
          isClosing ? 'translate-y-full sm:scale-95' : 'translate-y-0 sm:scale-100'
        }`}
      >
        {/* Drag Handle / Grabber */}
        <div
          className="w-full flex justify-center pt-3 pb-1 cursor-grab shrink-0 select-none"
          onClick={handleClose}
        >
          <div className="w-10 h-1.5 rounded-full bg-[#dde3ec]" />
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="overflow-y-auto px-4 sm:px-6 pb-28 pt-1 flex flex-col gap-5 no-scrollbar">
          {/* Dish Visual Header */}
          <div className="relative w-full h-52 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-slate-900">
            <img
              src={dishImage}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161c23]/70 via-transparent to-transparent" />

            {/* Dismiss Button */}
            <button
              type="button"
              aria-label="Close customizer"
              onClick={handleClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#ffffff]/80 backdrop-blur-md flex items-center justify-center text-[#161c23] hover:bg-[#ffffff] transition-all active:scale-95 shadow"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Freshness / Prep Badges */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-[#6cf8bb]/90 backdrop-blur-md text-[#00714d] text-xs font-bold flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>House Signature</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#ffffff]/90 backdrop-blur-md text-[#161c23] text-xs font-semibold flex items-center gap-1 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#a73400]" />
                <span>12 min prep</span>
              </span>
            </div>
          </div>

          {/* Title, Price & Flavor Profile */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="dish-customizer-title"
                className="text-xl sm:text-2xl font-bold text-[#161c23] tracking-tight leading-tight"
              >
                {item.name}
              </h2>
              <span className="text-xl sm:text-2xl font-extrabold text-[#ab2f00] shrink-0">
                {currencySymbol}
                {basePrice.toFixed(2)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5b4139] leading-relaxed">
              {dishDescription}
            </p>
          </div>

          {/* Option Group 1: Choose Your Broth Style */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#161c23]">
                Choose Your Broth Style
              </label>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ab2f00]">
                REQUIRED · 1 PICK
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {BROTH_OPTIONS.map((broth) => {
                const isSelected = selectedBroth === broth.id;
                return (
                  <label
                    key={broth.id}
                    onClick={() => setSelectedBroth(broth.id)}
                    className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] border border-transparent ${
                      isSelected
                        ? 'bg-[#e9eef8] border-[#ab2f00]/30 shadow-xs'
                        : 'bg-[#eef4fe] hover:bg-[#e9eef8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#ab2f00]' : 'bg-[#e3e8f2]'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-transform ${
                            isSelected ? 'bg-[#ffffff] scale-100' : 'bg-transparent scale-0'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#161c23]">
                          {broth.name}
                        </span>
                        {broth.subtext && (
                          <span className="text-xs text-[#5b4139]">
                            {broth.subtext}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        broth.priceModifier > 0
                          ? 'text-[#ab2f00] font-bold'
                          : 'text-[#5b4139]'
                      }`}
                    >
                      {broth.priceModifier > 0
                        ? `+${currencySymbol}${broth.priceModifier.toFixed(2)}`
                        : broth.id === 'rich'
                        ? 'Included'
                        : `+${currencySymbol}0.00`}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Option Group 2: Noodle Firmness (Pill Segmented Rail) */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#161c23]">
                Noodle Firmness
              </label>
              <span className="text-xs text-[#5b4139] font-medium">
                Japanese standard
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-[#e9eef8] rounded-xl">
              {NOODLE_FIRMNESS.map((noodle) => {
                const isActive = selectedFirmness === noodle.id;
                return (
                  <button
                    key={noodle.id}
                    type="button"
                    onClick={() => setSelectedFirmness(noodle.id)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                      isActive
                        ? 'bg-[#ffffff] text-[#ab2f00] shadow-sm'
                        : 'text-[#5b4139] hover:text-[#161c23]'
                    }`}
                  >
                    {noodle.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Option Group 3: Add-ons (Multi-select) */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#161c23]">
                Custom Add-ons
              </label>
              <span className="text-xs text-[#5b4139]">Optional extras</span>
            </div>

            <div className="flex flex-col gap-2">
              {ADDON_OPTIONS.map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] border border-transparent ${
                      isChecked
                        ? 'bg-[#e9eef8] border-[#ab2f00]/30 shadow-xs'
                        : 'bg-[#eef4fe] hover:bg-[#e9eef8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-[#ab2f00] text-[#ffffff]'
                            : 'bg-[#e3e8f2] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#161c23]">
                          {addon.name}
                        </span>
                        <span className="text-xs text-[#5b4139]">
                          {addon.subtext}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#161c23]">
                      +{currencySymbol}
                      {addon.price.toFixed(2)}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Chef's Note callout */}
          <div className="p-3.5 rounded-xl bg-[#ffdbd0]/80 text-[#390c00] flex items-start gap-2.5 border border-[#ffb59d]/60">
            <Sparkles className="w-4 h-4 text-[#a73400] shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Artisan Tip:</strong> We recommend &apos;Firm (Katame)&apos; noodles so
              your Hakata noodles keep ideal elasticity in our scorching collagen broth.
            </p>
          </div>
        </div>

        {/* Sticky Bottom Bar Tray */}
        <div className="absolute bottom-0 inset-x-0 bg-[#ffffff]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center gap-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] border-t border-[#dde3ec]/60">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-[#e9eef8] rounded-full p-1 shrink-0">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full bg-[#ffffff] text-[#161c23] flex items-center justify-center font-bold hover:bg-[#e3e8f2] active:scale-95 transition-all shadow-sm"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-extrabold text-[#161c23]">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-full bg-[#ffffff] text-[#161c23] flex items-center justify-center font-bold hover:bg-[#e3e8f2] active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isAcceptingOrders}
            className="flex-1 h-12 rounded-full bg-[#ab2f00] hover:bg-[#d53e02] disabled:opacity-50 text-[#ffffff] text-sm font-bold flex items-center justify-between px-5 sm:px-6 transition-all active:scale-[0.98] shadow-[0_8px_16px_-4px_rgba(171,47,0,0.35)]"
          >
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Order</span>
            </span>
            <span className="tracking-tight font-extrabold">
              {currencySymbol}
              {totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
