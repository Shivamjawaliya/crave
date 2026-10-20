'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Clock,
  Bike,
  User,
  Flame,
  Check,
  Plus,
  Minus,
  X,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Smartphone,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useCartStore } from '../../../../../../lib/store';

export default function StitchScreenViewerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.projectId as string) || '5230722148065772942';
  const screenId = (params?.screenId as string) || '62b846e0df9b472287f65cc4b3f3a774';

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [selectedBroth, setSelectedBroth] = useState<'rich' | 'spicy' | 'shoyu'>('rich');
  const [selectedFirmness, setSelectedFirmness] = useState<'firm' | 'regular' | 'soft'>('firm');
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['egg']); // Pre-checked in Stitch design
  const [quantity, setQuantity] = useState(1);
  const [viewMode, setViewMode] = useState<'mobile-frame' | 'responsive'>('mobile-frame');
  const [addedToast, setAddedToast] = useState(false);

  const { addItem, items: cartItems } = useCartStore();

  const basePrice = 18.50;
  const brothModifier = selectedBroth === 'spicy' ? 0.75 : 0.00;
  const addonsPrice = selectedAddons.reduce((acc, id) => {
    if (id === 'egg') return acc + 2.50;
    if (id === 'chashu') return acc + 4.00;
    if (id === 'menma') return acc + 1.50;
    return acc;
  }, 0);

  const singlePrice = basePrice + brothModifier + addonsPrice;
  const totalPrice = singlePrice * quantity;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAddToOrder = () => {
    const brothName =
      selectedBroth === 'spicy'
        ? 'Spicy Miso (+$0.75)'
        : selectedBroth === 'shoyu'
        ? 'Roasted Garlic Shoyu'
        : 'Rich Tonkotsu (Original)';

    const firmnessName =
      selectedFirmness === 'firm'
        ? 'Firm (Katame)'
        : selectedFirmness === 'soft'
        ? 'Soft'
        : 'Regular';

    const addonLabels = selectedAddons
      .map((a) => (a === 'egg' ? 'Soft Egg' : a === 'chashu' ? 'Pork Chashu' : 'Menma'))
      .join(', ');

    const desc = `${brothName}, ${firmnessName}${addonLabels ? ` + ${addonLabels}` : ''}`;

    // Add to cart store with paise conversion ($1 = 100 paise for demo conversion)
    addItem(
      'umai-craft-ramen',
      'Umai Handcrafted Ramen',
      {
        menuItemId: `tonkotsu-custom-${Date.now()}`,
        name: `Black Garlic Truffle Tonkotsu (${desc})`,
        pricePaise: Math.round(singlePrice * 100),
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDM6AKpSJSDbjj_OF3ryWK1zQCvi4VL3Bh1MoRDgDNaA_3H77f9a6Bvc5q5QUZHMimtOPqrnvSmh-HU3V8kbacLPBPB48bZuN00JHENKyKXLWF-I6VlHXsEoX9G3EbgGyQRbUsY7TNstyIKVzCIFhOmenp10rdD8m7_cEHCf7B_BKs6XUpoKue3IdWZtzEUTXTG9vka8PAHLpVGIjlo03_TGBVN6dC0y553BSVd6_be1QchdSGbHBNt',
      },
      quantity
    );

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-[#161c23] flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* Top Banner with Stitch Context */}
      <div className="bg-[#161c23] text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-300">Stitch Screen:</span>
          <span className="bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded text-[11px] truncate max-w-[200px] sm:max-w-none">
            {screenId}
          </span>
          <span className="text-slate-400 hidden md:inline">| Mobile Restaurant &amp; Dish Customizer</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[11px]">
            <button
              onClick={() => setViewMode('mobile-frame')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
                viewMode === 'mobile-frame' ? 'bg-[#ab2f00] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile Mockup</span>
            </button>
            <button
              onClick={() => setViewMode('responsive')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
                viewMode === 'responsive' ? 'bg-[#ab2f00] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full View</span>
            </button>
          </div>

          <Link
            href="/cart"
            className="flex items-center gap-1 bg-[#ab2f00] hover:bg-[#8f2700] text-white px-3 py-1 rounded-full font-bold transition shadow-sm"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
          </Link>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-0 sm:p-6 overflow-y-auto">
        <div
          className={`relative bg-[#f7f9ff] text-[#161c23] shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${
            viewMode === 'mobile-frame'
              ? 'w-full sm:w-[410px] sm:h-[880px] sm:rounded-[40px] sm:border-[8px] sm:border-[#161c23]'
              : 'w-full min-h-screen'
          }`}
        >
          {/* Mobile Shell Status Bar & Header */}
          <header className="sticky top-0 inset-x-0 z-30 bg-[#f7f9ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-[#dde3ec]/40">
            <div className="h-16 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Go back"
                  onClick={() => router.back()}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-[#161c23] hover:bg-[#e9eef8] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-[#161c23] truncate">Dish Details</h1>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#ab2f00] flex items-center justify-center shrink-0 text-white shadow-sm">
                <User className="w-4 h-4" />
              </div>
            </div>
          </header>

          {/* Screen Body Content */}
          <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
            {/* Restaurant Mini Hero / Summary */}
            <div className="px-4 pt-3 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-[#161c23] tracking-tight">
                    Umai Handcrafted Ramen
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-[#5b4139] text-xs font-semibold">
                    <div className="flex items-center text-[#ab2f00] font-bold">
                      <Star className="w-3.5 h-3.5 fill-[#ab2f00] mr-0.5" />
                      <span>4.9</span>
                    </div>
                    <span className="text-[#8f7067]">·</span>
                    <span>(1.2k reviews)</span>
                    <span className="text-[#8f7067]">·</span>
                    <span>0.8 mi</span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-[#e3e8f2] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="Umai Handcrafted Ramen"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1RaUNG2hqabVs0BNIUALOMzLvrqGyhR7IhY9q7lJCEFcQAkDrtlhL9xLy9wcAODz7VtsDo_02VQfvshel5kEFpn_jwm9GFj2M3T3et6_Mbfw7Lk86VXjRowUICdeereY5GG-jJF4bq10IUPe_9dg7v7eWqdDuf7ePBNrTnE3oGAYh3CSjy48LiUpE2I9HpgPZD5JFWPG6BemOIJ-Ah87-dbQADYadIdFTVyxKZx7JN4FSCpDBRuem"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-[#5b4139] flex-wrap">
                <span className="bg-[#e9eef8] px-2.5 py-1 rounded-full flex items-center gap-1 text-[#161c23] font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#ab2f00]" /> 20–30 min
                </span>
                <span className="bg-[#e9eef8] px-2.5 py-1 rounded-full flex items-center gap-1 text-[#161c23] font-medium">
                  <Bike className="w-3.5 h-3.5 text-[#006c49]" /> $1.49 fee
                </span>
                <span className="bg-[#e9eef8] px-2.5 py-1 rounded-full text-[#161c23] font-medium">
                  Japanese · Artisan
                </span>
              </div>
            </div>

            {/* Menu Items (Behind Modal) */}
            <div className="px-4 flex flex-col gap-4">
              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
                <button className="px-4 py-2 rounded-full bg-[#ab2f00] text-white text-xs font-bold whitespace-nowrap shadow-sm">
                  Popular
                </button>
                <button className="px-4 py-2 rounded-full bg-[#e9eef8] text-[#5b4139] text-xs font-semibold whitespace-nowrap">
                  Signature Ramen
                </button>
                <button className="px-4 py-2 rounded-full bg-[#e9eef8] text-[#5b4139] text-xs font-semibold whitespace-nowrap">
                  Small Plates
                </button>
              </div>

              {/* Background Dish Card 1 */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="p-4 rounded-2xl bg-white shadow-sm flex gap-3 items-center cursor-pointer border border-[#dde3ec]/60 hover:shadow-md transition"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#ab2f00] font-bold uppercase tracking-wider">
                    Chef&apos;s Special
                  </span>
                  <h3 className="text-sm font-bold text-[#161c23] mt-0.5 truncate">
                    Black Garlic Truffle Tonkotsu
                  </h3>
                  <p className="text-xs text-[#5b4139] line-clamp-2 mt-1">
                    Rich 18-hour collagen broth infused with toasted garlic oils &amp; earthy black truffle shavings.
                  </p>
                  <span className="text-sm font-extrabold text-[#161c23] mt-2 block">$18.50</span>
                </div>
                <div className="w-24 h-24 rounded-xl bg-[#e9eef8] shrink-0 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="Black Garlic Truffle Tonkotsu"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA65UOnNKQ21lkdUlC7U4_O7SJDsGRMy3q0k0Tows7F405rOxldBlvsGr_Mw_fug-cx5EaxZYkGWLMq6ZO4JSSJ1dS-8Xq7l_taecwlYTb7c1vtemOXSKrP8eIeYqHCz4f_g8g24RoXqeiaLXCs_1jeonWmzK7hqHdwoZPcAvUgNU0FvxejJ-RuYCfs22kG4cFa524xwRH4Lk17QJAqqIpnDsMLGuKU5cNnxXNops7YbsQRUqTtGgCD"
                  />
                </div>
              </div>

              {/* Background Dish Card 2 */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="p-4 rounded-2xl bg-white shadow-sm flex gap-3 items-center cursor-pointer border border-[#dde3ec]/60 hover:shadow-md transition"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#161c23] truncate">
                    Tokyo Classic Shoyu
                  </h3>
                  <p className="text-xs text-[#5b4139] line-clamp-2 mt-1">
                    Clear aged soy dashi broth, tori chashu, tender nori, and house bamboo shoots.
                  </p>
                  <span className="text-sm font-extrabold text-[#161c23] mt-2 block">$16.75</span>
                </div>
                <div className="w-24 h-24 rounded-xl bg-[#e9eef8] shrink-0 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="Tokyo Classic Shoyu"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKveySoz1j-gB8BNkt-w09XzFUNveznv0yAQ5XLUQGQ9XiK7X-5z5hBNEisQoXgysX0TIWKYjR-UdsXFlsAkGNF-BX8-wfrR4AzqplMwpChmU1gIXx7nR-8NcBYJ8XUQVoayZzmC22XQuU1KRaHtMjjPyv3-o990EB9fQQQvgWo_1PejM8C0gfRAEfv0ayoX9_bt1bAHERSq764pZsGWp4P6uSJ_C9bHtfEIjlomouMse7vVhFcSVx"
                  />
                </div>
              </div>
            </div>

            {/* Reopen button if closed */}
            {!isModalOpen && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 rounded-full bg-[#ab2f00] text-white font-bold text-xs shadow-lg hover:bg-[#8f2700] transition active:scale-95"
                >
                  Reopen Dish Customizer
                </button>
              </div>
            )}
          </main>

          {/* ELEVATED INTERACTIVE BOTTOM SHEET MODAL (STITCH REPLICA) */}
          {isModalOpen && (
            <>
              {/* Dimmer Scrim */}
              <div
                className="absolute inset-0 bg-[#161c23]/40 backdrop-blur-sm z-40 transition-opacity"
                onClick={() => setIsModalOpen(false)}
              />

              {/* Elevated Interactive Bottom Sheet Modal */}
              <div
                id="ramen-sheet"
                className="absolute inset-x-0 bottom-0 z-50 max-h-[85%] flex flex-col bg-white rounded-t-[2rem] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden animate-in slide-in-from-bottom duration-300"
              >
                {/* Drag Handle / Grabber */}
                <div
                  className="w-full flex justify-center pt-3 pb-1 cursor-grab shrink-0 select-none"
                  onClick={() => setIsModalOpen(false)}
                >
                  <div className="w-10 h-1.5 rounded-full bg-[#dde3ec]" />
                </div>

                {/* Modal Content Scrollable Area */}
                <div className="overflow-y-auto px-4 pb-28 pt-1 flex flex-col gap-5 no-scrollbar">
                  {/* Dish Visual Header */}
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-slate-900">
                    <img
                      className="w-full h-full object-cover"
                      alt="Black Garlic Truffle Tonkotsu Ramen"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM6AKpSJSDbjj_OF3ryWK1zQCvi4VL3Bh1MoRDgDNaA_3H77f9a6Bvc5q5QUZHMimtOPqrnvSmh-HU3V8kbacLPBPB48bZuN00JHENKyKXLWF-I6VlHXsEoX9G3EbgGyQRbUsY7TNstyIKVzCIFhOmenp10rdD8m7_cEHCf7B_BKs6XUpoKue3IdWZtzEUTXTG9vka8PAHLpVGIjlo03_TGBVN6dC0y553BSVd6_be1QchdSGbHBNt"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161c23]/70 via-transparent to-transparent" />

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      aria-label="Close customizer"
                      onClick={() => setIsModalOpen(false)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#161c23] hover:bg-white transition-all active:scale-95 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Freshness / Prep Badges */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-[#6cf8bb]/90 backdrop-blur-md text-[#00714d] text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>House Signature</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#161c23] text-xs font-semibold flex items-center gap-1 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-[#a73400]" />
                        <span>12 min prep</span>
                      </span>
                    </div>
                  </div>

                  {/* Title, Price & Flavor Profile */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-xl font-bold text-[#161c23] tracking-tight">
                        Black Garlic Truffle Tonkotsu
                      </h2>
                      <span className="text-xl font-extrabold text-[#ab2f00] shrink-0">
                        ${basePrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-[#5b4139] leading-relaxed">
                      Handmade Hakata noodles nestled in a 24-hour slow-boiled pork bone collagen broth, infused with charred black garlic oil and shaved winter truffles.
                    </p>
                  </div>

                  {/* Option Group 1: Broth Style (Radio Group) */}
                  <section className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-[#161c23]">
                        Choose Your Broth Style
                      </label>
                      <span className="text-[11px] font-bold text-[#ab2f00] uppercase tracking-wider">
                        REQUIRED · 1 PICK
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Radio 1 (Original) */}
                      <label
                        onClick={() => setSelectedBroth('rich')}
                        className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] ${
                          selectedBroth === 'rich' ? 'bg-[#e9eef8]' : 'bg-[#eef4fe]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              selectedBroth === 'rich' ? 'bg-[#ab2f00]' : 'bg-[#e3e8f2]'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                selectedBroth === 'rich' ? 'bg-white' : 'bg-transparent'
                              }`}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[#161c23]">
                            Rich Tonkotsu (Original)
                          </span>
                        </div>
                        <span className="text-xs text-[#5b4139] font-medium">Included</span>
                      </label>

                      {/* Radio 2 (Spicy Miso) */}
                      <label
                        onClick={() => setSelectedBroth('spicy')}
                        className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] ${
                          selectedBroth === 'spicy' ? 'bg-[#e9eef8]' : 'bg-[#eef4fe]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              selectedBroth === 'spicy' ? 'bg-[#ab2f00]' : 'bg-[#e3e8f2]'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                selectedBroth === 'spicy' ? 'bg-white' : 'bg-transparent'
                              }`}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#161c23]">Spicy Miso</span>
                            <span className="text-xs text-[#5b4139]">
                              House fermented red chili blend
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#ab2f00]">+$0.75</span>
                      </label>

                      {/* Radio 3 (Roasted Garlic Shoyu) */}
                      <label
                        onClick={() => setSelectedBroth('shoyu')}
                        className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] ${
                          selectedBroth === 'shoyu' ? 'bg-[#e9eef8]' : 'bg-[#eef4fe]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              selectedBroth === 'shoyu' ? 'bg-[#ab2f00]' : 'bg-[#e3e8f2]'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                selectedBroth === 'shoyu' ? 'bg-white' : 'bg-transparent'
                              }`}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[#161c23]">
                            Roasted Garlic Shoyu
                          </span>
                        </div>
                        <span className="text-xs text-[#5b4139] font-medium">+$0.00</span>
                      </label>
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
                      {(['firm', 'regular', 'soft'] as const).map((firmness) => {
                        const isActive = selectedFirmness === firmness;
                        const label =
                          firmness === 'firm'
                            ? 'Firm (Katame)'
                            : firmness === 'regular'
                            ? 'Regular'
                            : 'Soft';

                        return (
                          <button
                            key={firmness}
                            type="button"
                            onClick={() => setSelectedFirmness(firmness)}
                            className={`py-2.5 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                              isActive
                                ? 'bg-white text-[#ab2f00] shadow-sm'
                                : 'text-[#5b4139] hover:text-[#161c23]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Option Group 3: Add-ons (Multi-select) */}
                  <section className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-[#161c23]">Custom Add-ons</label>
                      <span className="text-xs text-[#5b4139]">Optional extras</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Add-on 1: Soft Egg (Pre-checked in Stitch screenshot) */}
                      <label
                        onClick={() => toggleAddon('egg')}
                        className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] ${
                          selectedAddons.includes('egg') ? 'bg-[#e9eef8]' : 'bg-[#eef4fe]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white ${
                              selectedAddons.includes('egg')
                                ? 'bg-[#ab2f00]'
                                : 'bg-[#e3e8f2] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#161c23]">
                              Ajitsuke Soft Egg
                            </span>
                            <span className="text-xs text-[#5b4139]">
                              Marinated organic jammy yolk
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#161c23]">+$2.50</span>
                      </label>

                      {/* Add-on 2: Chashu */}
                      <label
                        onClick={() => toggleAddon('chashu')}
                        className={`cursor-pointer p-3.5 rounded-xl flex items-center justify-between transition-colors active:scale-[0.99] ${
                          selectedAddons.includes('chashu') ? 'bg-[#e9eef8]' : 'bg-[#eef4fe]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white ${
                              selectedAddons.includes('chashu')
                                ? 'bg-[#ab2f00]'
                                : 'bg-[#e3e8f2] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#161c23]">
                              Extra Pork Chashu (2 pcs)
                            </span>
                            <span className="text-xs text-[#5b4139]">
                              Torch-seared tender belly
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#161c23]">+$4.00</span>
                      </label>
                    </div>
                  </section>

                  {/* Chef's Note callout */}
                  <div className="p-3.5 rounded-xl bg-[#ffdbd0] text-[#390c00] flex items-start gap-2.5 border border-[#ffb59d]/50">
                    <Sparkles className="w-4 h-4 text-[#a73400] shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      <strong>Artisan Tip:</strong> We recommend &apos;Firm (Katame)&apos; noodles so
                      your Hakata noodles keep ideal elasticity in our scorching collagen broth.
                    </p>
                  </div>
                </div>

                {/* Sticky Bottom Bar Tray */}
                <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md p-4 flex items-center gap-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] border-t border-[#dde3ec]/60">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#e9eef8] rounded-full p-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-full bg-white text-[#161c23] flex items-center justify-center font-bold hover:bg-[#e3e8f2] active:scale-95 transition-all shadow-sm"
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
                      className="w-9 h-9 rounded-full bg-white text-[#161c23] flex items-center justify-center font-bold hover:bg-[#e3e8f2] active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={handleAddToOrder}
                    className="flex-1 h-12 rounded-full bg-[#ab2f00] hover:bg-[#d53e02] text-white text-sm font-bold flex items-center justify-between px-5 transition-all active:scale-[0.98] shadow-[0_8px_16px_-4px_rgba(171,47,0,0.35)]"
                  >
                    <span>Add to Order</span>
                    <span className="tracking-tight font-extrabold">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Toast Notification */}
          {addedToast && (
            <div className="absolute top-20 inset-x-4 z-50 bg-[#006c49] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="text-xs font-bold">Added to your order!</span>
              </div>
              <Link href="/cart" className="text-xs underline font-extrabold">
                View Cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
