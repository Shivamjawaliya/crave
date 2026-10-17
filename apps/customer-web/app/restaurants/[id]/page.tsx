'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Clock,
  Truck,
  Heart,
  Share2,
  Search,
  Plus,
  Minus,
  Check,
  X,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Utensils,
  Flame,
  Info,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import NavbarAuth from '../../../components/NavbarAuth';
import { useCartStore } from '../../../lib/store';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  categories: MenuCategory[];
}

export default function RestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Customizer Modal State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [brothStyle, setBrothStyle] = useState('rich');
  const [noodleFirmness, setNoodleFirmness] = useState('firm');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [includeUtensils, setIncludeUtensils] = useState(true);

  // Cart Store
  const { items: cartItems, addItem, updateQuantity, removeItem, getSubtotalPaise } = useCartStore();
  const cartSubtotal = (getSubtotalPaise() / 100).toFixed(2);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    async function fetchRestaurant() {
      if (!restaurantId) return;
      try {
        const primaryUrl =
          process.env.NEXT_PUBLIC_GATEWAY_URL ||
          `http://localhost:3001/api/v1/restaurants/${restaurantId}`;

        let res = await fetch(primaryUrl).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`http://localhost:4002/restaurants/${restaurantId}`).catch(() => null);
        }

        if (res && res.ok) {
          const data = await res.json();
          setRestaurant(data);
        }
      } catch (err) {
        console.error('Failed to load restaurant details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [restaurantId]);

  // Dynamic calculation for customizer modal
  const itemFinalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    let price = selectedItem.pricePaise / 100;
    if (brothStyle === 'spicy') price += 0.75;
    if (selectedToppings.includes('tamago')) price += 2.0;
    if (selectedToppings.includes('chashu')) price += 4.0;
    if (selectedToppings.includes('bamboo')) price += 1.5;
    return price * quantity;
  }, [selectedItem, brothStyle, selectedToppings, quantity]);

  const handleOpenCustomizer = (item: MenuItem) => {
    setSelectedItem(item);
    setBrothStyle('rich');
    setNoodleFirmness('firm');
    setSelectedToppings([]);
    setQuantity(1);
  };

  const handleAddCustomizedItem = () => {
    if (!selectedItem || !restaurant) return;
    const finalPaise = Math.round(itemFinalPrice * 100 / quantity);

    const customizationNotes = [
      brothStyle === 'spicy' ? 'Spicy Miso Broth' : 'Rich Tonkotsu',
      noodleFirmness === 'firm' ? 'Firm (Katame)' : noodleFirmness === 'soft' ? 'Soft' : 'Regular',
      ...selectedToppings.map((t) => t.toUpperCase()),
    ].join(', ');

    addItem(restaurant.id, restaurant.name, {
      menuItemId: `${selectedItem.id}-${Date.now()}`,
      name: `${selectedItem.name} (${customizationNotes})`,
      pricePaise: finalPaise,
      imageUrl: selectedItem.imageUrl,
    });

    setSelectedItem(null);
  };

  const filteredCategories = useMemo(() => {
    if (!restaurant?.categories) return [];
    if (!menuSearch.trim()) return restaurant.categories;
    const q = menuSearch.toLowerCase();
    return restaurant.categories.map((c) => ({
      ...c,
      items: c.items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q),
      ),
    })).filter((c) => c.items.length > 0);
  }, [restaurant, menuSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#ab2f00] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-700">Loading Culinary Menu...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-black text-[#ab2f00]">Restaurant Not Found</h2>
        <p className="text-sm text-slate-600 mt-2">The kitchen requested is currently unavailable.</p>
        <Link href="/" className="mt-4 px-6 py-2.5 rounded-full bg-[#ab2f00] text-white text-xs font-bold shadow">
          Return to Explore
        </Link>
      </div>
    );
  }

  // Cover image based on restaurant
  const coverImage =
    restaurant.categories?.[0]?.items?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1600&auto=format&fit=crop&q=80';

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* 1. TOP HEADER */}
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

            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00]">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Deliver to
                </span>
                <span className="text-xs font-bold text-[#161c23]">742 Evergreen Terr, 4B</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cart"
              className="flex items-center gap-2 bg-[#ab2f00] hover:bg-[#8f2700] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md shadow-[#ab2f00]/25 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({totalCartCount}) • ₹{cartSubtotal}</span>
            </Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* 2. RESTAURANT HERO COVER BANNER */}
      <section className="relative bg-[#161c23] text-white overflow-hidden min-h-[380px] flex items-end">
        <img
          src={coverImage}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter blur-[0.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161c23] via-[#161c23]/70 to-black/30" />

        <div className="relative max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2 transition border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Explore</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#006c49] text-white text-[10px] font-black uppercase tracking-wider shadow">
                MICHELIN GUIDE 2024
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-200 text-[10px] font-semibold border border-slate-700">
                HANDCRAFTED NOODLES
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {restaurant.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                4.9 (1,210+ reviews)
              </span>
              <span>•</span>
              <span>0.6 mi away</span>
              <span>•</span>
              <span>$$</span>
              <span>•</span>
              <span>{restaurant.description}</span>
            </div>
          </div>

          {/* Right Metrics Box & Actions */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                EST. PREP TIME
              </span>
              <strong className="text-sm font-extrabold text-white">20–30 min</strong>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                DELIVERY FEE
              </span>
              <strong className="text-sm font-extrabold text-emerald-400">₹40 (Free &gt; ₹500)</strong>
            </div>

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-11 h-11 rounded-2xl backdrop-blur-md border border-slate-700 flex items-center justify-center transition ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-slate-900/80 text-white hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY NAV TABS & SEARCH BAR */}
      <section className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#ab2f00] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {restaurant.categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                  activeTab === cat.id
                    ? 'bg-[#ab2f00] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({cat.items.length})
              </button>
            ))}
          </div>

          <div className="relative hidden md:block max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 focus:bg-white text-xs font-medium rounded-full border border-slate-200 outline-none"
            />
          </div>
        </div>
      </section>

      {/* 4. MAIN LAYOUT: MENU + STICKY CART SIDEBAR */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left: Menu Sections */}
        <div className="lg:col-span-8 space-y-10">
          {/* Chef Special Drop Banner */}
          <div className="bg-gradient-to-r from-[#fff5f2] to-[#fffbf9] border border-[#ffdbd1] p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ab2f00] block">
                CHEF'S SPECIAL DROP
              </span>
              <h3 className="text-sm font-black text-slate-900 pt-0.5">
                Crafted with 18-Hour Kurobuta Collagen Broth
              </h3>
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                Slow-simmered broth, char-seared chashu pork belly, and organic ajitsuke tamago. Limited to 40 bowls daily.
              </p>
            </div>
          </div>

          {/* Render Menu Categories */}
          {filteredCategories
            .filter((c) => activeTab === 'all' || activeTab === c.id)
            .map((cat, catIdx) => (
              <section key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {cat.name}
                  </h2>
                  <span className="text-xs text-slate-500 font-bold">
                    {cat.items.length} Selections
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenCustomizer(item)}
                      className="group cursor-pointer bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#ab2f00] transition line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="pt-2 flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              House Broth
                            </span>
                          </div>
                        </div>

                        {item.imageUrl && (
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCustomizer(item);
                              }}
                              className="absolute bottom-1 right-1 w-7 h-7 rounded-xl bg-white text-[#ab2f00] flex items-center justify-center shadow-md hover:bg-[#ab2f00] hover:text-white transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                        <strong className="text-[#ab2f00] text-sm font-black">
                          ₹{(item.pricePaise / 100).toFixed(2)}
                        </strong>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomizer(item);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#ffdbd1]/50 hover:bg-[#ffdbd1] text-[#ab2f00] font-bold text-xs flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Customize & Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>

        {/* Right: Sticky Cart Sidebar matching Stitch */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-slate-900">
                  Your Cart ({totalCartCount})
                </h3>
                <span className="text-xs text-[#006c49] font-bold">
                  {restaurant.name}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#006c49] text-[10px] font-extrabold uppercase">
                Active Kitchen
              </span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-600">Your cart is currently empty</p>
                <p className="text-[11px] text-slate-400">Click any dish to customize and add to your order.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-72 overflow-y-auto no-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.menuItemId} className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                      <span className="text-[#ab2f00] font-bold">
                        ₹{((item.pricePaise * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-full shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="text-slate-600 hover:text-red-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-900 text-xs px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="text-slate-600 hover:text-emerald-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Packaging & Utensils Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUtensils}
                  onChange={(e) => setIncludeUtensils(e.target.checked)}
                  className="rounded text-[#ab2f00] focus:ring-[#ab2f00] mt-0.5"
                />
                <span className="leading-tight">
                  Include wooden chopsticks & napkins <strong className="text-emerald-700">(Zero plastic waste certified)</strong>
                </span>
              </label>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (5% GST)</span>
                <span className="font-bold text-slate-900">₹{(Number(cartSubtotal) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-[#006c49]">₹40.00</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-[#ab2f00]">
                  ₹{(Number(cartSubtotal) > 0 ? Number(cartSubtotal) * 1.05 + 40 : 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <Link
              href="/cart"
              className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                cartItems.length > 0
                  ? 'bg-[#ab2f00] hover:bg-[#8f2700] text-white shadow-[#ab2f00]/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
              }`}
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </Link>

            <div className="text-[11px] text-center text-slate-400 font-medium">
              ⚡ Estimated arrival in 20–30 mins once placed
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE ITEM CUSTOMIZER MODAL (Centerpiece of Stitch Screen) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Image Header */}
            <div className="relative h-48 w-full bg-slate-900 overflow-hidden shrink-0">
              {selectedItem.imageUrl && (
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ab2f00] text-white text-[10px] font-extrabold uppercase">
                    House Signature
                  </span>
                  <span className="text-white text-[10px] bg-black/60 px-2 py-0.5 rounded-full font-medium">
                    Prep time: 12 min
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{selectedItem.name}</h3>
                <span className="text-xs text-[#ffdbd1] font-bold block">
                  ₹{(selectedItem.pricePaise / 100).toFixed(2)} base
                </span>
              </div>
            </div>

            {/* Customization Options Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <p className="text-slate-600 leading-relaxed font-normal">
                {selectedItem.description}
              </p>

              {/* Step 1: Choose Broth Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold text-slate-900">
                    Choose Your Broth Style
                  </strong>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ab2f00] bg-[#ffdbd1] px-2 py-0.5 rounded-full">
                    REQUIRED
                  </span>
                </div>

                <div className="space-y-2">
                  <label
                    onClick={() => setBrothStyle('rich')}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      brothStyle === 'rich'
                        ? 'border-[#ab2f00] bg-[#fff5f2]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Rich Tonkotsu (Original Pork Collagen)</span>
                      <span className="text-slate-500 text-[11px]">Silky, intense, umami forward</span>
                    </div>
                    <span className="font-bold text-slate-600">Free</span>
                  </label>

                  <label
                    onClick={() => setBrothStyle('spicy')}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      brothStyle === 'spicy'
                        ? 'border-[#ab2f00] bg-[#fff5f2]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Spicy Miso Tonkotsu Infusion</span>
                      <span className="text-slate-500 text-[11px]">Red Sendai miso and house chili paste</span>
                    </div>
                    <span className="font-bold text-[#ab2f00]">+₹60.00</span>
                  </label>

                  <label
                    onClick={() => setBrothStyle('shoyu')}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      brothStyle === 'shoyu'
                        ? 'border-[#ab2f00] bg-[#fff5f2]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Roasted Garlic Shoyu Dashi</span>
                      <span className="text-slate-500 text-[11px]">Lighter profile with aged dark soy tare</span>
                    </div>
                    <span className="font-bold text-slate-600">Free</span>
                  </label>
                </div>
              </div>

              {/* Step 2: Noodle Firmness */}
              <div className="space-y-2">
                <strong className="text-sm font-extrabold text-slate-900 block">
                  Noodle Firmness
                </strong>
                <span className="text-[11px] text-slate-500 block">Authentic noodle chew preference</span>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['firm', 'regular', 'soft'].map((firmness) => (
                    <button
                      key={firmness}
                      onClick={() => setNoodleFirmness(firmness)}
                      className={`py-2 px-3 rounded-xl font-bold capitalize transition ${
                        noodleFirmness === firmness
                          ? 'bg-[#ab2f00] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {firmness === 'firm' ? 'Firm (Katame)' : firmness === 'regular' ? 'Regular (Futsu)' : 'Soft (Yawarame)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Add-ons & Extra Toppings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold text-slate-900">
                    Add-ons & Extra Toppings
                  </strong>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'tamago', label: 'Ajitsuke Soft Boiled Tamago Egg', price: '₹160.00' },
                    { id: 'chashu', label: 'Extra Flame-Torched Chashu Belly (2 pcs)', price: '₹320.00' },
                    { id: 'bamboo', label: 'Seasoned Menma Bamboo Shoots', price: '₹120.00' },
                  ].map((top) => {
                    const isChecked = selectedToppings.includes(top.id);
                    return (
                      <label
                        key={top.id}
                        onClick={() =>
                          setSelectedToppings((prev) =>
                            isChecked ? prev.filter((t) => t !== top.id) : [...prev, top.id],
                          )
                        }
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                          isChecked ? 'border-[#006c49] bg-emerald-50/50' : 'border-slate-200'
                        }`}
                      >
                        <span className="font-semibold text-slate-800">{top.label}</span>
                        <span className="font-bold text-[#ab2f00]">+{top.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Customizer Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-slate-600 hover:text-red-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-slate-900 text-sm w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-slate-600 hover:text-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddCustomizedItem}
                className="flex-1 py-3 px-5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ab2f00]/30 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Order — ₹{itemFinalPrice.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CRAVE FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Crave Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/cart" className="hover:underline">Checkout</Link>
              <a href="http://localhost:3002" className="hover:underline">Merchant Dashboard</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
