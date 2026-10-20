'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
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
  Percent,
} from 'lucide-react';
import NavbarAuth from '../../../components/NavbarAuth';
import AddressModal from '../../../components/AddressModal';
import DishCustomizerModal from '../../../components/DishCustomizerModal';
import { useCartStore } from '../../../lib/store';
import { useAddressStore } from '../../../lib/address.store';

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
  isAcceptingOrders?: boolean;
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
  const [includeUtensils, setIncludeUtensils] = useState(true);

  // Cart Store
  const { items: cartItems, addItem, updateQuantity, removeItem, getSubtotalPaise } = useCartStore();
  const cartSubtotal = (getSubtotalPaise() / 100).toFixed(2);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Address Store
  const { selectedAddress, openModal, hydrateFromStorage } = useAddressStore();

  useEffect(() => {
    hydrateFromStorage();
    async function fetchRestaurant() {
      if (!restaurantId) return;
      try {
        const rawGateway = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/+$/, '') || 'http://localhost:3001/api/v1';
        const primaryUrl = `${rawGateway}/restaurants/${restaurantId}`;

        let res = await fetch(primaryUrl).catch(() => null);

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

  const handleOpenCustomizer = (item: MenuItem) => {
    if (restaurant?.isAcceptingOrders === false) {
      alert('This kitchen has temporarily paused incoming orders. Please check back shortly!');
      return;
    }
    setSelectedItem(item);
  };

  const isItemInCart = (cartItem: (typeof cartItems)[0], dishId: string) => {
    return cartItem.menuItemId === dishId || cartItem.menuItemId.startsWith(`${dishId}-`);
  };

  const getItemCartQuantity = (dishId: string) => {
    return cartItems
      .filter((ci) => isItemInCart(ci, dishId))
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const handleIncrementItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurant?.isAcceptingOrders === false) {
      alert('This kitchen has temporarily paused incoming orders. Please check back shortly!');
      return;
    }
    const matching = cartItems.find((ci) => isItemInCart(ci, item.id));
    if (matching) {
      updateQuantity(matching.menuItemId, 1);
    } else {
      addItem(
        restaurant?.id || restaurantId,
        restaurant?.name || 'Restaurant',
        {
          menuItemId: item.id,
          name: item.name,
          pricePaise: item.pricePaise,
          imageUrl: item.imageUrl,
        },
        1
      );
    }
  };

  const handleDecrementItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const matchingList = cartItems.filter((ci) => isItemInCart(ci, item.id));
    if (matchingList.length > 0) {
      const lastItem = matchingList[matchingList.length - 1];
      updateQuantity(lastItem.menuItemId, -1);
    }
  };

  const handleDirectAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurant?.isAcceptingOrders === false) {
      alert('This kitchen has temporarily paused incoming orders. Please check back shortly!');
      return;
    }
    addItem(
      restaurant?.id || restaurantId,
      restaurant?.name || 'Restaurant',
      {
        menuItemId: item.id,
        name: item.name,
        pricePaise: item.pricePaise,
        imageUrl: item.imageUrl,
      },
      1
    );
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
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </div>
              <span className="font-serif font-black text-xl sm:text-2xl tracking-tight text-[#161c23]">
                Crave
              </span>
            </Link>

            {/* Deliver To Selector (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00]">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Deliver to
                </span>
                <button
                  type="button"
                  onClick={openModal}
                  className="flex items-center gap-1 text-xs font-bold text-[#161c23] hover:text-[#ab2f00] transition cursor-pointer"
                >
                  <span suppressHydrationWarning className="truncate max-w-[150px]">{selectedAddress.addressLine}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Deliver To Selector (Mobile Pill) */}
            <button
              type="button"
              onClick={openModal}
              className="flex lg:hidden items-center gap-1 py-1 px-2 rounded-full bg-[#ffdbd1]/50 hover:bg-[#ffdbd1] transition max-w-[130px] sm:max-w-[180px] text-left cursor-pointer"
              title="Change Delivery Address"
            >
              <MapPin className="w-3 h-3 text-[#ab2f00] shrink-0" />
              <span suppressHydrationWarning className="text-[10px] sm:text-[11px] font-bold text-[#161c23] truncate">
                {selectedAddress.addressLine}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/cart"
              className="flex items-center gap-1.5 sm:gap-2 bg-[#ab2f00] hover:bg-[#8f2700] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs shadow-md shadow-[#ab2f00]/25 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cart ({totalCartCount}) • ₹{cartSubtotal}</span>
              <span className="sm:hidden text-[11px]">{totalCartCount > 0 ? `(${totalCartCount}) ₹${cartSubtotal}` : 'Cart'}</span>
            </Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* 2. RESTAURANT HERO COVER BANNER */}
      <section className="relative bg-[#161c23] text-white overflow-hidden min-h-[260px] sm:min-h-[380px] flex items-end">
        <img
          src={coverImage}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter blur-[0.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161c23] via-[#161c23]/70 to-black/30" />

        <div className="relative max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-1 transition border border-white/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Explore</span>
            </Link>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#006c49] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow">
                MICHELIN GUIDE 2024
              </span>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-800/80 text-slate-200 text-[9px] sm:text-[10px] font-semibold border border-slate-700">
                HANDCRAFTED NOODLES
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {restaurant.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
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
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-center">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                EST. PREP TIME
              </span>
              <strong className="text-xs sm:text-sm font-extrabold text-white">20–30 min</strong>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-center">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                DELIVERY FEE
              </span>
              <strong className="text-xs sm:text-sm font-extrabold text-emerald-400">₹40 (Free &gt; ₹500)</strong>
            </div>

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl backdrop-blur-md border border-slate-700 flex items-center justify-center transition shrink-0 ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-slate-900/80 text-white hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY NAV TABS & SEARCH BAR */}
      <section className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition shrink-0 ${
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
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition shrink-0 ${
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
          {/* Orders Paused Notice */}
          {restaurant.isAcceptingOrders === false && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-red-900 tracking-tight">Orders Temporarily Paused</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    This restaurant is not accepting new orders at this time. Please check back later.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-red-100 text-red-800 font-mono text-xs font-black rounded-xl uppercase tracking-wider shrink-0 border border-red-200">
                Kitchen Paused
              </span>
            </div>
          )}

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
                  {cat.items.map((item) => {
                    const itemQty = getItemCartQuantity(item.id);

                    return (
                      <div
                        key={item.id}
                        id={`dish-${item.id}`}
                        onClick={() => handleOpenCustomizer(item)}
                        className="group cursor-pointer bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-3 sm:gap-4 scroll-mt-28 target:border-[#ab2f00] target:ring-2 target:ring-[#ab2f00]/30"
                      >
                        {/* Left Details */}
                        <div className="space-y-1.5 min-w-0 flex-1 flex flex-col justify-between self-stretch">
                          <div>
                            {/* Veg Indicator & Reorder Tag */}
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <span className="w-2.5 h-1 rounded-full bg-emerald-500 inline-block" />
                                Highly reordered
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#ab2f00] transition leading-snug line-clamp-1">
                              {item.name}
                            </h4>
                            <strong className="text-slate-900 text-sm sm:text-base font-bold block pt-0.5">
                              ₹{(item.pricePaise / 100).toFixed(0)}
                            </strong>
                            <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed pt-1">
                              {item.description || 'Artisan preparation crafted with fresh, premium seasonal ingredients.'}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center gap-2 text-slate-400">
                            <span className="text-[11px] font-medium text-slate-500">
                              House Special • Fresh Daily
                            </span>
                          </div>
                        </div>

                        {/* Right: Image + Stepper / ADD Button (Zomato/Swiggy Style) */}
                        <div className="flex flex-col items-center shrink-0 w-28 sm:w-32">
                          <div className="relative w-28 h-24 sm:w-32 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                            <img
                              src={
                                item.imageUrl ||
                                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80'
                              }
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>

                          {/* Stepper / ADD Button */}
                          <div className="-mt-3.5 relative z-10 flex flex-col items-center w-full">
                            {itemQty === 0 ? (
                              <button
                                type="button"
                                onClick={(e) => handleDirectAdd(item, e)}
                                className="h-8 px-4 sm:px-5 rounded-xl bg-white text-[#ab2f00] border border-[#ffdbd1] shadow-md hover:shadow-lg hover:bg-[#fff5f2] font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                              >
                                <span>ADD</span>
                                <Plus className="w-3.5 h-3.5 text-[#ab2f00] stroke-[2.5]" />
                              </button>
                            ) : (
                              <div className="h-8 px-2 rounded-xl bg-[#ab2f00] text-white shadow-md flex items-center justify-between gap-1.5 min-w-[88px] sm:min-w-[96px]">
                                <button
                                  type="button"
                                  onClick={(e) => handleDecrementItem(item, e)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/15 active:scale-90 transition text-white cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <span className="font-extrabold text-xs text-white px-1">
                                  {itemQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrementItem(item, e)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/15 active:scale-90 transition text-white cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCustomizer(item);
                              }}
                              className="text-[10px] text-slate-400 hover:text-[#ab2f00] font-medium mt-1 transition cursor-pointer"
                            >
                              customisable
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* 5. INTERACTIVE ITEM CUSTOMIZER MODAL (Pixel-perfect replica of Stitch screen 62b846e0df9b472287f65cc4b3f3a774) */}
      <DishCustomizerModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        currencySymbol="₹"
        isAcceptingOrders={restaurant.isAcceptingOrders !== false}
        onAddToCart={({ menuItemId, name, pricePaise, imageUrl, quantity }) => {
          addItem(
            restaurant.id,
            restaurant.name,
            {
              menuItemId: `${menuItemId}-${Date.now()}`,
              name,
              pricePaise,
              imageUrl,
            },
            quantity
          );
        }}
      />

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

      {/* Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
