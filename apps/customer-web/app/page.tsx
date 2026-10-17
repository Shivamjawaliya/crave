'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  ShoppingBag,
  Clock,
  Star,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  Truck,
  Sparkles,
  Copy,
  Check,
  Plus,
  X,
  RotateCcw,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Utensils,
  Award,
  Leaf,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import NavbarAuth from '../components/NavbarAuth';
import AddressModal from '../components/AddressModal';
import { useCartStore } from '../lib/store';
import { useAddressStore } from '../lib/address.store';

// Types for Real Restaurant Data from Backend
interface RealMenuItem {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface RealMenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: RealMenuItem[];
}

interface RealRestaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  categories: RealMenuCategory[];
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<RealRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [quickReorderDismissed, setQuickReorderDismissed] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RealRestaurant | null>(null);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Cart store
  const { items: cartItems, addItem, getSubtotalPaise } = useCartStore();
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = (getSubtotalPaise() / 100).toFixed(2);

  // Address store
  const { selectedAddress, openModal } = useAddressStore();

  // Fetch real restaurants and menus from API Gateway / Restaurant Service
  useEffect(() => {
    async function fetchRealRestaurants() {
      try {
        const primaryUrl =
          process.env.NEXT_PUBLIC_GATEWAY_URL ||
          'http://localhost:3001/api/v1/restaurants';

        let res = await fetch(primaryUrl).catch(() => null);
        if (!res || !res.ok) {
          // Direct microservice fallback
          res = await fetch('http://localhost:4002/restaurants').catch(() => null);
        }

        if (res && res.ok) {
          const data: RealRestaurant[] = await res.json();
          setRestaurants(data);
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealRestaurants();
  }, []);

  const handleCopyPromo = () => {
    navigator.clipboard?.writeText('EPICUREAN');
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleAddToCart = (restaurant: RealRestaurant, item: RealMenuItem) => {
    addItem(restaurant.id, restaurant.name, {
      menuItemId: item.id,
      name: item.name,
      pricePaise: item.pricePaise,
      imageUrl: item.imageUrl,
    });
    setAddedItemName(item.name);
    setTimeout(() => setAddedItemName(null), 2500);
  };

  // Quick reorder handler for Umai Ramen from banner
  const handleQuickReorder = () => {
    const umai = restaurants.find((r) => r.name.includes('Umai Ramen'));
    if (umai) {
      const tonkotsu = umai.categories
        ?.flatMap((c) => c.items)
        ?.find((i) => i.name.includes('Tonkotsu'));
      if (tonkotsu) {
        handleAddToCart(umai, tonkotsu);
        return;
      }
    }
    // Fallback item
    addItem('umai-ramen-id', 'Umai Ramen & Izakaya', {
      menuItemId: 'quick-tonkotsu',
      name: 'Black Garlic Tonkotsu Ramen',
      pricePaise: 58000,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    });
    setAddedItemName('Black Garlic Tonkotsu Ramen');
    setTimeout(() => setAddedItemName(null), 2500);
  };

  // Category tags
  const categories = [
    { name: 'All', icon: '🔥' },
    { name: 'Artisan Pizza', icon: '🍕' },
    { name: 'Ramen & Bowls', icon: '🍜' },
    { name: 'Gourmet Burgers', icon: '🍔' },
    { name: 'Sushi & Poke', icon: '🍣' },
    { name: 'Healthy & Greens', icon: '🥗' },
    { name: 'Bakery & Dessert', icon: '🥐' },
    { name: 'Meat & Grill', icon: '🥩' },
  ];

  // Specific restaurant categorization matching Stitch design
  const trendingRestaurants = useMemo(() => {
    const order = [
      'Umai Ramen & Izakaya',
      'Tartine Artisan Bakery',
      'Nori Bistro & Sushi',
      'Lucia Wood-Fired Pizza',
    ];
    return order
      .map((name) => restaurants.find((r) => r.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])))
      .filter((r): r is RealRestaurant => Boolean(r));
  }, [restaurants]);

  const speedyRestaurants = useMemo(() => {
    const order = [
      'Smash & Co.',
      'Olive & Thyme',
      'Tacos Del Sol',
      'Kinfolk Roastery',
    ];
    return order
      .map((name) => restaurants.find((r) => r.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])))
      .filter((r): r is RealRestaurant => Boolean(r));
  }, [restaurants]);

  // Filtered restaurants for search and category selection
  const filteredRestaurants = useMemo(() => {
    let list = restaurants.filter((r) => !r.name.includes('Wagyu')); // Exclude Wagyu tasting header
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.categories?.some((c) =>
            c.items.some((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)),
          ),
      );
    }
    if (selectedCategory !== 'All') {
      const catMap: Record<string, string[]> = {
        'Artisan Pizza': ['pizza', 'lucia', 'neapolitan'],
        'Ramen & Bowls': ['ramen', 'umai', 'tantanmen', 'bowls'],
        'Gourmet Burgers': ['burgers', 'smash', 'shake'],
        'Sushi & Poke': ['sushi', 'nori', 'poke', 'nigiri'],
        'Healthy & Greens': ['greens', 'salad', 'olive', 'vegan'],
        'Bakery & Dessert': ['bakery', 'tartine', 'croissant', 'sourdough', 'kinfolk'],
        'Meat & Grill': ['wagyu', 'tacos', 'smash', 'kebab'],
      };
      const keywords = catMap[selectedCategory] || [];
      list = list.filter((r) =>
        keywords.some(
          (k) =>
            r.name.toLowerCase().includes(k) ||
            r.description?.toLowerCase().includes(k),
        ),
      );
    }
    return list;
  }, [restaurants, searchQuery, selectedCategory]);

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* 1. TOP LIVE COURIER DISPATCH TICKER */}
      <div className="bg-[#fff1ed] border-b border-[#e4beb4]/40 text-[#ab2f00] text-[11px] font-semibold py-1.5 px-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between overflow-x-auto whitespace-nowrap gap-6 no-scrollbar">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ab2f00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ab2f00]"></span>
            </span>
            <span className="font-extrabold uppercase tracking-wider text-[10px] bg-[#ab2f00] text-white px-2 py-0.5 rounded-full">
              Live Courier Dispatch
            </span>
            <span className="text-[#5b4139]">
              Average delivery time across downtown: <strong className="text-[#161c23]">22 mins</strong>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[#5b4139]">
            <span>•</span>
            <span>
              Chef Special drop at 18:00:{' '}
              <strong className="text-[#ab2f00]">Truffle Brioche Steak Sando</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#006c49]" /> Temperature Assured
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-[#006c49]" /> 100% Compostable Packaging
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#f7f9ff]/95 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.04)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Delivery Address Dropdown */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <span className="font-serif font-black text-2xl tracking-tight text-[#161c23]">
                Crave
              </span>
            </Link>

            {/* Deliver To Selector */}
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
                  <span className="truncate max-w-[150px]">{selectedAddress.addressLine}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Delivery / Pickup Segmented Control */}
          <div className="hidden sm:flex bg-slate-200/80 p-1 rounded-full border border-slate-300/60 text-xs font-bold shrink-0">
            <button
              onClick={() => setDeliveryMode('delivery')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                deliveryMode === 'delivery'
                  ? 'bg-white text-[#161c23] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setDeliveryMode('pickup')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                deliveryMode === 'pickup'
                  ? 'bg-white text-[#161c23] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pickup
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 relative hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, dishes..."
                className="w-full pl-10 pr-12 py-2.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs font-medium rounded-full border border-slate-200 focus:border-[#ab2f00] outline-none transition"
              />
              <span className="absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                ⌘K
              </span>
            </div>
          </div>

          {/* Actions: Offers, Past Orders, Cart Pill & NavbarAuth */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="#trending"
              className="hidden xl:inline text-xs font-bold text-slate-700 hover:text-[#ab2f00] transition"
            >
              Offers
            </Link>
            <Link
              href="/orders"
              className="hidden xl:inline text-xs font-bold text-slate-700 hover:text-[#ab2f00] transition"
            >
              Past Orders
            </Link>

            {/* Cart Pill Button */}
            <Link
              href="/cart"
              className="flex items-center gap-2 bg-[#ab2f00] hover:bg-[#8f2700] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md shadow-[#ab2f00]/25 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                Cart ({totalCartCount}) • ₹{cartSubtotal}
              </span>
            </Link>

            {/* Authenticated Customer Avatar / Sign In */}
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* Floating Add-to-Cart Toast */}
      {addedItemName && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161c23] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
          <div>
            <p className="text-xs font-bold">Added to cart!</p>
            <p className="text-[11px] text-slate-400">{addedItemName}</p>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 flex-1">
        {/* 3. HERO BANNER: MICHELIN EDITION */}
        <section className="relative rounded-[28px] overflow-hidden bg-[#181c20] text-white shadow-2xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[420px]">
            {/* Left Content */}
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between z-10 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-[#ab2f00] text-white text-[11px] font-extrabold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm">
                    <Star className="w-3 h-3 fill-current" /> Michelin Edition
                  </span>
                  <span className="px-3 py-1 bg-slate-800/80 text-slate-300 text-[11px] font-semibold rounded-full border border-slate-700">
                    Valid until Sunday midnight
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
                  Free delivery on culinary masterworks this week
                </h1>

                <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
                  Savor seasonal menus hand-crafted by neighborhood awardees. Zero delivery fees on curated orders over ₹400.
                </p>
              </div>

              {/* Promo code & Countdown */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-xl text-xs font-mono">
                  <span className="text-slate-400 font-sans text-[11px] uppercase tracking-wider">PROMO CODE:</span>
                  <strong className="text-white tracking-widest text-sm">EPICUREAN</strong>
                  <button
                    onClick={handleCopyPromo}
                    title="Copy Promo Code"
                    className="text-slate-400 hover:text-white transition ml-1"
                  >
                    {copiedPromo ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900/70 border border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-[#ab2f00]" />
                  <span>47h : 29m : 09s</span>
                </div>
              </div>

              {/* CTA & Social Proof */}
              <div className="flex flex-wrap items-center gap-5 pt-2">
                <Link
                  href="#trending"
                  className="bg-[#ab2f00] hover:bg-[#8f2700] text-white px-6 py-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#ab2f00]/30 transition group"
                >
                  <span>Claim Offer & Browse</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-[#181c20] text-white flex items-center justify-center text-[10px] font-bold">
                      ID
                    </div>
                    <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-[#181c20] text-white flex items-center justify-center text-[10px] font-bold">
                      AA
                    </div>
                    <div className="w-7 h-7 rounded-full bg-rose-600 border-2 border-[#181c20] text-white flex items-center justify-center text-[10px] font-bold">
                      MS
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    <strong className="text-white">540+</strong> gourmet orders today
                  </span>
                </div>
              </div>
            </div>

            {/* Right Gourmet Visual with Floating Chef Badge */}
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80"
                alt="L'Atelier Charcoal Wagyu"
                className="w-full h-full object-cover object-center transform scale-105 hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181c20] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#181c20] lg:via-transparent lg:to-transparent" />

              {/* Floating Chef Highlight Badge */}
              <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-md text-[#161c23] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-100 max-w-xs">
                <div className="w-8 h-8 rounded-xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ab2f00] block">
                    CHEF HIGHLIGHT
                  </span>
                  <span className="text-xs font-extrabold leading-tight block">
                    L'Atelier Charcoal Wagyu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EXPLORE CATEGORIES BAR */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold tracking-tight text-[#161c23]">
              Explore Categories
            </h2>
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-[#ab2f00] hover:underline flex items-center gap-1"
            >
              <span>View All 24</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                    isActive
                      ? 'bg-[#ab2f00] text-white border-[#ab2f00] shadow-md shadow-[#ab2f00]/20'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. FILTER & SORT CHIP BAR */}
        <section className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold transition">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters (2)</span>
            </button>

            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ffdbd1]/60 text-[#ab2f00] border border-[#ab2f00]/20 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Under 30 mins</span>
              <X className="w-3 h-3 ml-0.5 cursor-pointer" />
            </span>

            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Rating 4.5+</span>
            </button>

            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              <Truck className="w-3.5 h-3.5 text-[#006c49]" />
              <span>Free Delivery</span>
            </button>

            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
              <span>Price ($$)</span>
              <X className="w-3 h-3 ml-0.5 cursor-pointer" />
            </span>

            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              <Leaf className="w-3.5 h-3.5 text-[#006c49]" />
              <span>Dietary (Vegan, GF)</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
            <span>Sort:</span>
            <button className="font-bold text-[#161c23] hover:text-[#ab2f00] flex items-center gap-1">
              <span>Recommended</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* 6. SECTION: TRENDING AROUND YOU */}
        <section id="trending" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#ab2f00] block">
                COMMUNITY FAVORITES
              </span>
              <h2 className="text-2xl font-black text-[#161c23] tracking-tight">
                Trending Around You
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Updated 4 mins ago based on live kitchen order volume
            </span>
          </div>

          {/* 4 Cards in Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingRestaurants.map((restaurant, idx) => {
              // Custom metadata matching Stitch design
              const badges = ['FEATURED', '20% OFF OVER $35', 'CHEF SPECIAL', 'MOST LOVED'];
              const badgeColors = [
                'bg-[#ab2f00] text-white',
                'bg-[#006c49] text-white',
                'bg-slate-800 text-slate-100',
                'bg-[#ab2f00] text-white',
              ];
              const times = ['20–30 min', '15–25 min', '25–35 min', '20–30 min'];
              const ratings = ['4.9 (1.2k)', '4.8 (750+)', '4.9 (2.1k)', '4.7 (1.4k)'];
              const deliveryFees = ['Free delivery', '$0.99 fee', 'Free delivery', '$1.49 fee'];
              const distances = ['$$ • 0.6 mi', '$$ • 1.1 mi', '$$$ • 1.6 mi', '$$ • 0.9 mi'];

              const firstCategory = restaurant.categories?.[0];
              const firstItem = firstCategory?.items?.[0];
              const cardImage =
                firstItem?.imageUrl ||
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';

              return (
                <div
                  key={restaurant.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={cardImage}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Top Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${badgeColors[idx % 4]}`}
                      >
                        {badges[idx % 4]}
                      </span>
                    </div>

                    {/* Heart Favorite Button */}
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-700 hover:text-red-500 hover:bg-white flex items-center justify-center shadow transition">
                      <Heart className="w-4 h-4" />
                    </button>

                    {/* Time Badge Overlay */}
                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#ffdbd1]" />
                      <span>{times[idx % 4]}</span>
                    </div>

                    {/* QUICK REORDER OVERLAY FOR CARD 2 (Tartine) */}
                    {idx === 1 && !quickReorderDismissed && (
                      <div className="absolute inset-x-2 bottom-2 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-xl flex items-center justify-between gap-2 z-20">
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase text-[#ab2f00] tracking-wider block">
                            QUICK REORDER
                          </span>
                          <span className="text-[11px] font-bold text-[#161c23] truncate block">
                            Umai Ramen • Black Garlic Tonkot...
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={handleQuickReorder}
                            className="bg-[#ab2f00] hover:bg-[#8f2700] text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
                          >
                            <span>Reorder $21.50</span>
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setQuickReorderDismissed(true)}
                            className="text-slate-400 hover:text-slate-700 p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <Link
                          href={`/restaurants/${restaurant.id}`}
                          className="font-extrabold text-sm text-[#161c23] hover:text-[#ab2f00] transition line-clamp-1"
                        >
                          {restaurant.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{ratings[idx % 4]}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 font-medium line-clamp-1 pt-0.5">
                        {restaurant.description}
                      </p>
                    </div>

                    {/* Delivery & Distance Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#006c49]">
                        {deliveryFees[idx % 4]}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {distances[idx % 4]}
                      </span>
                    </div>

                    {/* Explore Full Menu Button */}
                    <Link
                      href={`/restaurants/${restaurant.id}`}
                      className="w-full mt-2 py-2 text-center text-xs font-bold text-[#ab2f00] bg-[#ffdbd1]/40 hover:bg-[#ffdbd1] rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <span>Explore Menu ({restaurant.categories?.reduce((acc, c) => acc + c.items.length, 0)} items)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. SECTION: SPEEDY CRAVINGS (< 25 MIN) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#006c49] flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h2 className="text-xl font-black text-[#161c23] tracking-tight">
                  Speedy Cravings (&lt; 25 min)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Prepared rapidly and expedited with dedicated point-to-point couriers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Speedy Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {speedyRestaurants.map((restaurant, idx) => {
              const speedTimes = ['15–20 min', '12–18 min', '16–22 min', '10–15 min'];
              const speedTags = ['$0 delivery fee', 'Zero waste kitchen', 'Free Delivery', 'Express Barista'];
              const footers = ['Fastest in your area', 'Eco Packaging', 'Spicy & Fresh', 'In-house Roasted'];
              const distances = ['0.4 miles away', '0.6 miles away', '0.7 miles away', '0.3 miles away'];

              const firstCategory = restaurant.categories?.[0];
              const firstItem = firstCategory?.items?.[0];
              const cardImage =
                firstItem?.imageUrl ||
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800';

              return (
                <div
                  key={restaurant.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={cardImage}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Delivery Time Top Left */}
                    <div className="absolute top-3 left-3 bg-[#006c49] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3" />
                      <span>{speedTimes[idx % 4]}</span>
                    </div>

                    {/* Tag Bottom Left */}
                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                      {speedTags[idx % 4]}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <Link
                          href={`/restaurants/${restaurant.id}`}
                          className="font-extrabold text-sm text-[#161c23] hover:text-[#ab2f00] transition line-clamp-1"
                        >
                          {restaurant.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>4.8</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 font-medium line-clamp-1 pt-0.5">
                        {restaurant.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-[#006c49]">
                        {footers[idx % 4]}
                      </span>
                      <span>{distances[idx % 4]}</span>
                    </div>

                    <Link
                      href={`/restaurants/${restaurant.id}`}
                      className="w-full mt-2 py-2 text-center text-xs font-bold text-[#006c49] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <span>Explore Menu</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. TRUST & CURATION PROPS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-[#f0f4f8] rounded-2xl p-6 border border-slate-200/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#ab2f00] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#161c23]">
                Taste Tested Curation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                We partner exclusively with kitchen teams adhering to the Crave Culinary Quality Standard.
              </p>
            </div>
          </div>

          <div className="bg-[#f0f4f8] rounded-2xl p-6 border border-slate-200/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#006c49] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#161c23]">
                Insulated Micro-Fleet
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Active temperature-regulated delivery pods ensure your food arrives piping hot or crisp and cold.
              </p>
            </div>
          </div>

          <div className="bg-[#f0f4f8] rounded-2xl p-6 border border-slate-200/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#ab2f00] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#161c23]">
                Crave Guild Pass
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Enjoy unrestricted ₹0 delivery fees, priority kitchen queueing, and exclusive tasting table invitations.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 9. REAL RESTAURANT MENU MODAL (Opens on Card Click) */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ab2f00]">
                  REAL KITCHEN MENU
                </span>
                <h2 className="text-2xl font-black text-[#161c23] tracking-tight">
                  {selectedRestaurant.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  {selectedRestaurant.description} • {selectedRestaurant.address}
                </p>
              </div>

              <button
                onClick={() => setSelectedRestaurant(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Categories & Items List */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {selectedRestaurant.categories?.map((cat) => (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    {cat.name}
                  </h3>

                  <div className="space-y-3">
                    {cat.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 pt-0.5">
                              {item.description}
                            </p>
                            <span className="text-xs font-extrabold text-[#ab2f00] pt-1 block">
                              ₹{(item.pricePaise / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(selectedRestaurant, item)}
                          className="bg-[#ab2f00] hover:bg-[#8f2700] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Items are prepared fresh upon order placement.
              </span>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MULTI-PORTAL ROLE SWITCHER BAR */}
      <div className="bg-slate-100 border-t border-b border-slate-200 py-3 px-4 text-xs font-medium text-slate-600">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <span className="font-bold text-slate-800">Platform Portal Switcher:</span>
          <div className="flex items-center gap-5 flex-wrap">
            <a
              href="http://localhost:3002"
              className="text-[#006c49] hover:underline font-bold flex items-center gap-1"
            >
              <span>🍽️ Kitchen Display (:3002)</span>
            </a>
            <a
              href="http://localhost:3003"
              className="text-[#006c49] hover:underline font-bold flex items-center gap-1"
            >
              <span>🛵 Delivery Partner (:3003)</span>
            </a>
            <a
              href="http://localhost:3004"
              className="text-[#ab2f00] hover:underline font-bold flex items-center gap-1"
            >
              <span>🛡️ Admin Console (:3004)</span>
            </a>
            <a
              href="http://localhost:3001/api/docs"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:underline font-bold flex items-center gap-1"
            >
              <span>📚 Swagger API Docs (:3001)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 11. AUTHENTIC CRAVE FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 pt-14 pb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ab2f00] flex items-center justify-center text-white">
                  <Flame className="w-4 h-4 fill-current" />
                </div>
                <span className="font-serif font-black text-xl text-[#161c23]">
                  Crave
                </span>
              </Link>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-normal">
                Curated artisan dining and neighborhood gourmet favorites delivered fresh to your doorstep with meticulous craft.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold">
                  <span> App Store</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold">
                  <span>▶ Google Play</span>
                </div>
              </div>
            </div>

            {/* Discover Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                DISCOVER
              </h4>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li><a href="#" className="hover:text-[#ab2f00] transition">Artisan Bakery</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Farm to Table</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Wood-fired Pizza</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Handcrafted Sushi</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Plant-based & Vegan</a></li>
              </ul>
            </div>

            {/* Partner Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                PARTNER
              </h4>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li><a href="#" className="hover:text-[#ab2f00] transition">Become a Crave Chef</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Courier Fleet</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Corporate Catering</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Culinary Grants</a></li>
                <li><a href="http://localhost:3002" className="hover:text-[#ab2f00] transition">Merchant Dashboard</a></li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                SUPPORT
              </h4>
              <ul className="space-y-2 text-xs text-slate-500 font-medium">
                <li><a href="#" className="hover:text-[#ab2f00] transition">Help Center</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Live Chat Support</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Order Tracking FAQ</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Dietary Standards</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Crave Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Cookie Preferences</a>
              <a href="#" className="hover:underline">Security</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
