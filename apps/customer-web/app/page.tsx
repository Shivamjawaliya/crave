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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  Truck,
  Sparkles,
  Copy,
  Check,
  Plus,
  Minus,
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
  Bell,
  User,
  Mic,
  Zap,
} from 'lucide-react';
import NavbarAuth from '../components/NavbarAuth';
import AddressModal from '../components/AddressModal';
import DishCustomizerModal from '../components/DishCustomizerModal';
import ZomatoSearchBar from '../components/ZomatoSearchBar';
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
  isAcceptingOrders?: boolean;
  categories: RealMenuCategory[];
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<RealRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAllCategoriesExpanded, setIsAllCategoriesExpanded] = useState<boolean>(false);

  // Filters state (all cleared by default: on 'Any' / 'All')
  const [filterUnder30, setFilterUnder30] = useState<boolean>(false);
  const [filterRating45, setFilterRating45] = useState<boolean>(false);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState<boolean>(false);
  const [filterPrice, setFilterPrice] = useState<'all' | '$' | '$$' | '$$$'>('all');
  const [filterDietary, setFilterDietary] = useState<'all' | 'vegan' | 'gf' | 'veg'>('all');

  // Sort state
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'fastest' | 'price_asc' | 'price_desc'>('recommended');

  // Dropdown & Modal states
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState<boolean>(false);
  const [isDietaryDropdownOpen, setIsDietaryDropdownOpen] = useState<boolean>(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterUnder30) count++;
    if (filterRating45) count++;
    if (filterFreeDelivery) count++;
    if (filterPrice !== 'all') count++;
    if (filterDietary !== 'all') count++;
    return count;
  }, [filterUnder30, filterRating45, filterFreeDelivery, filterPrice, filterDietary]);

  // Global click & Escape listener for closing filter dropdowns
  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsPriceDropdownOpen(false);
        setIsDietaryDropdownOpen(false);
        setIsSortDropdownOpen(false);
      }
    }
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsPriceDropdownOpen(false);
        setIsDietaryDropdownOpen(false);
        setIsSortDropdownOpen(false);
        setIsFilterModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const [copiedPromo, setCopiedPromo] = useState(false);
  const [quickReorderDismissed, setQuickReorderDismissed] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RealRestaurant | null>(null);
  const [customizingItem, setCustomizingItem] = useState<{
    item: RealMenuItem;
    restaurant: RealRestaurant;
  } | null>(null);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Live countdown timer for Michelin Epicurean Drop matching Stitch design
  const [promoTimer, setPromoTimer] = useState('01:42:14');
  useEffect(() => {
    let totalSecs = 6134;
    const interval = setInterval(() => {
      if (totalSecs > 0) {
        totalSecs--;
        const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
        const s = String(totalSecs % 60).padStart(2, '0');
        setPromoTimer(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Speedy Cravings items matching Stitch mobile screen
  const speedyItems = useMemo(
    () => [
      {
        name: 'Truffle Gruyère Smash Burger',
        restaurant: 'Forge Burger Co.',
        price: 16.5,
        tag: 'REORDER',
        sub: 'Delivered 4 times',
        time: '18m',
        img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'Spicy Ponzu Ahi Bowl',
        restaurant: 'Pacific Bowl Lab',
        price: 18.0,
        tag: 'POPULAR',
        sub: 'Free delivery',
        time: '22m',
        img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: 'San Marzano Margherita D.O.P',
        restaurant: 'Bella Forno 800°',
        price: 15.2,
        tag: 'REORDER',
        sub: 'Wood Fired',
        time: '20m',
        img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
      },
    ],
    []
  );

  // Cart store
  const { items: cartItems, addItem, updateQuantity, getSubtotalPaise } = useCartStore();
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = (getSubtotalPaise() / 100).toFixed(2);

  const handleQuickAddSpeedy = (item: (typeof speedyItems)[0]) => {
    const matched =
      restaurants.find((r) => r.name.toLowerCase().includes(item.restaurant.toLowerCase())) ||
      restaurants[0];
    const restId = matched ? matched.id : 'speedy-restaurant';
    const restName = matched ? matched.name : item.restaurant;

    addItem(restId, restName, {
      menuItemId: `speedy-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: item.name,
      pricePaise: Math.round(item.price * 100),
      imageUrl: item.img,
    });
    setAddedItemName(item.name);
    setTimeout(() => setAddedItemName(null), 2500);
  };

  // Address store
  const { selectedAddress, openModal, hydrateFromStorage } = useAddressStore();

  // Fetch real restaurants and menus from API Gateway / Restaurant Service
  const fetchRealRestaurants = React.useCallback(async (retries = 3) => {
    setLoading(true);
    try {
      const rawGateway = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/+$/, '') || 'http://localhost:3001/api/v1';
      const cleanGateway = rawGateway.replace(/\/restaurants\/?$/, '');
      const primaryUrl = `${cleanGateway}/restaurants?openOnly=true`;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await fetch(primaryUrl);
          if (res && res.ok) {
            const data: RealRestaurant[] = await res.json();
            if (Array.isArray(data)) {
              // Strictly only show restaurants that are accepting orders
              const openRestaurants = data.filter((r) => r.isAcceptingOrders !== false);
              setRestaurants(openRestaurants);
              return;
            }
          }
        } catch (e) {
          console.warn(`[Restaurant Fetch] Attempt ${attempt} failed:`, e);
        }
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateFromStorage();
    fetchRealRestaurants();
  }, [fetchRealRestaurants, hydrateFromStorage]);

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

  // 24 Full Categories matching Zomato/Stitch design
  const ALL_CATEGORIES = useMemo(() => [
    { name: 'All', icon: '🔥', keywords: [] as string[] },
    { name: 'Artisan Pizza', icon: '🍕', keywords: ['pizza', 'lucia', 'neapolitan', 'crust', 'calzone', 'wood-fired'] },
    { name: 'Ramen & Bowls', icon: '🍜', keywords: ['ramen', 'umai', 'tantanmen', 'bowls', 'noodle', 'broth', 'tonkotsu', 'miso'] },
    { name: 'Gourmet Burgers', icon: '🍔', keywords: ['burgers', 'smash', 'shake', 'patty', 'fries', 'bun'] },
    { name: 'Sushi & Poke', icon: '🍣', keywords: ['sushi', 'nori', 'poke', 'nigiri', 'sashimi', 'salmon', 'tuna', 'roll'] },
    { name: 'Healthy & Greens', icon: '🥗', keywords: ['greens', 'salad', 'olive', 'vegan', 'kale', 'avocado', 'hummus', 'bowl'] },
    { name: 'Bakery & Dessert', icon: '🥐', keywords: ['bakery', 'tartine', 'croissant', 'sourdough', 'kinfolk', 'pastry', 'cake', 'bakes', 'chocolate'] },
    { name: 'Meat & Grill', icon: '🥩', keywords: ['wagyu', 'grill', 'bbq', 'steak', 'tenderloin', 'kebab', 'charcoal', 'meat'] },
    { name: 'Mexican & Tacos', icon: '🌮', keywords: ['tacos', 'del sol', 'quesabirria', 'mexican', 'salsa', 'nachos'] },
    { name: 'Juices & Coolers', icon: '🍹', keywords: ['juice', 'juicy', 'shake', 'mojito', 'soda', 'lemonade', 'cooler', 'mocktail', 'smoothie'] },
    { name: 'Specialty Coffee', icon: '☕', keywords: ['coffee', 'roastery', 'kinfolk', 'pour over', 'chemex', 'espresso', 'latte', 'brew'] },
    { name: 'Italian & Pasta', icon: '🍝', keywords: ['pasta', 'trattoria', 'mario', 'luigi', 'spaghetti', 'lasagna', 'risotto', 'italian'] },
    { name: 'Biryani & Rice', icon: '🍚', keywords: ['biryani', 'rice', 'pulao', 'fried rice', 'basmati'] },
    { name: 'Dim Sum & Momos', icon: '🥟', keywords: ['dim sum', 'gyoza', 'dumpling', 'momo', 'wonton', 'bao'] },
    { name: 'Pure Vegetarian', icon: '🥬', keywords: ['veg', 'paneer', 'green', 'falafel', 'tofu', 'vegetarian'] },
    { name: 'Desserts & Gelato', icon: '🍨', keywords: ['gelato', 'ice cream', 'dessert', 'babka', 'sweet', 'pastry'] },
    { name: 'Crispy Chicken', icon: '🍗', keywords: ['karaage', 'chicken', 'wings', 'crispy', 'fried chicken'] },
    { name: 'Japanese Izakaya', icon: '🍱', keywords: ['izakaya', 'umai', 'bento', 'omakase', 'teriyaki', 'japanese'] },
    { name: 'Sandwiches & Wraps', icon: '🥪', keywords: ['sando', 'sandwich', 'wrap', 'brioche', 'melt', 'panini'] },
    { name: 'Seafood & Catch', icon: '🐟', keywords: ['cod', 'fish', 'baja', 'seafood', 'shrimp', 'crab'] },
    { name: 'Street Bites', icon: '🍟', keywords: ['fries', 'street', 'tapas', 'snacks', 'bites'] },
    { name: 'Breakfast & Brunch', icon: '🥞', keywords: ['morning', 'bun', 'pancake', 'waffle', 'breakfast', 'toast'] },
    { name: 'Tea & Infusions', icon: '🍵', keywords: ['tea', 'iced tea', 'matcha', 'chai', 'herbal'] },
    { name: 'Gourmet Specials', icon: '✨', keywords: ['gourmet', 'chef', 'tasting', 'signature', 'special'] },
  ], []);

  // Helper to compute rich metadata per restaurant for filtering and display
  const getRestaurantMeta = React.useCallback((restaurant: RealRestaurant) => {
    const name = restaurant.name.toLowerCase();
    const desc = (restaurant.description || '').toLowerCase();

    // 1. Delivery time (in minutes)
    let deliveryTime = 25;
    if (name.includes('smash') || name.includes('juicy')) deliveryTime = 18;
    else if (name.includes('olive') || name.includes('kinfolk')) deliveryTime = 20;
    else if (name.includes('umai')) deliveryTime = 22;
    else if (name.includes('tacos')) deliveryTime = 24;
    else if (name.includes('tartine')) deliveryTime = 25;
    else if (name.includes('lucia')) deliveryTime = 28;
    else if (name.includes('nori')) deliveryTime = 32;
    else if (name.includes('luigi') || name.includes('mario')) deliveryTime = 35;
    else {
      const code = restaurant.id.charCodeAt(restaurant.id.length - 1) || 0;
      deliveryTime = 20 + (code % 22);
    }

    // 2. Rating & review count
    let rating = 4.8;
    let reviewCount = 180;
    if (name.includes('umai') || name.includes('nori')) {
      rating = 4.9;
      reviewCount = 340;
    } else if (name.includes('lucia') || name.includes('tartine') || name.includes('olive')) {
      rating = 4.8;
      reviewCount = 290;
    } else if (name.includes('smash') || name.includes('kinfolk')) {
      rating = 4.7;
      reviewCount = 210;
    } else if (name.includes('juicy') || name.includes('tacos')) {
      rating = 4.6;
      reviewCount = 160;
    } else {
      const code = restaurant.id.charCodeAt(restaurant.id.length - 1) || 0;
      rating = 4.3 + ((code % 6) * 0.1);
      reviewCount = 50 + (code * 4);
    }

    // 3. Free Delivery eligibility
    const hasFreeDelivery = deliveryTime <= 25 || rating >= 4.7 || name.includes('juicy') || name.includes('lucia');

    // 4. Price Level: $ (Under ₹250), $$ (₹250-₹600), $$$ (₹600+)
    const items = restaurant.categories?.flatMap((c) => c.items) || [];
    const prices = items.map((i) => i.pricePaise / 100).filter((p) => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 350;

    let priceLevel: '$' | '$$' | '$$$' = '$$';
    if (avgPrice < 250) priceLevel = '$';
    else if (avgPrice > 600) priceLevel = '$$$';

    // 5. Dietary Flags
    const allText = (name + ' ' + desc + ' ' + items.map(i => i.name + ' ' + (i.description || '')).join(' ')).toLowerCase();
    const isVegan = allText.includes('vegan') || allText.includes('cold-pressed') || allText.includes('detox') || allText.includes('greens') || name.includes('juicy');
    const isGlutenFree = allText.includes('gluten') || allText.includes('gf') || allText.includes('poke') || allText.includes('nigiri') || allText.includes('salad') || name.includes('nori') || name.includes('juicy');
    const isVegetarian = isVegan || allText.includes('veg') || allText.includes('margherita') || allText.includes('mojito') || allText.includes('croissant') || allText.includes('sourdough') || allText.includes('falafel') || allText.includes('hummus') || name.includes('tartine') || name.includes('lucia');

    return {
      deliveryTime,
      rating,
      reviewCount,
      hasFreeDelivery,
      priceLevel,
      avgPrice,
      isVegan,
      isGlutenFree,
      isVegetarian,
    };
  }, []);

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
      .filter((r): r is RealRestaurant => Boolean(r && r.isAcceptingOrders !== false));
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
      .filter((r): r is RealRestaurant => Boolean(r && r.isAcceptingOrders !== false));
  }, [restaurants]);

  // Filtered and Sorted restaurants for search, categories, and all filter chips
  const filteredRestaurants = useMemo(() => {
    let list = restaurants.filter((r) => !r.name.includes('Wagyu') && r.isAcceptingOrders !== false);

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q) ||
          r.categories?.some((c) =>
            c.name.toLowerCase().includes(q) ||
            c.items.some((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)),
          ),
      );
    }

    // 2. Category Selection Filter
    if (selectedCategory !== 'All') {
      const catObj = ALL_CATEGORIES.find((c) => c.name === selectedCategory);
      const keywords = catObj && catObj.keywords.length > 0 ? catObj.keywords : [selectedCategory.toLowerCase()];
      list = list.filter((r) => {
        const name = r.name.toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const catNames = r.categories?.map((c) => c.name.toLowerCase()).join(' ') || '';
        const itemNames = r.categories?.flatMap((c) => c.items.map((i) => i.name.toLowerCase())).join(' ') || '';
        return keywords.some(
          (k) =>
            name.includes(k) ||
            desc.includes(k) ||
            catNames.includes(k) ||
            itemNames.includes(k),
        );
      });
    }

    // 3. Filter: Under 30 mins
    if (filterUnder30) {
      list = list.filter((r) => getRestaurantMeta(r).deliveryTime <= 30);
    }

    // 4. Filter: Rating 4.5+
    if (filterRating45) {
      list = list.filter((r) => getRestaurantMeta(r).rating >= 4.5);
    }

    // 5. Filter: Free Delivery
    if (filterFreeDelivery) {
      list = list.filter((r) => getRestaurantMeta(r).hasFreeDelivery);
    }

    // 6. Filter: Price Range ($, $$, $$$)
    if (filterPrice !== 'all') {
      list = list.filter((r) => getRestaurantMeta(r).priceLevel === filterPrice);
    }

    // 7. Filter: Dietary Preference
    if (filterDietary === 'vegan') {
      list = list.filter((r) => getRestaurantMeta(r).isVegan);
    } else if (filterDietary === 'gf') {
      list = list.filter((r) => getRestaurantMeta(r).isGlutenFree);
    } else if (filterDietary === 'veg') {
      list = list.filter((r) => getRestaurantMeta(r).isVegetarian);
    }

    // 8. Sorting
    const sorted = [...list].sort((a, b) => {
      const metaA = getRestaurantMeta(a);
      const metaB = getRestaurantMeta(b);
      switch (sortBy) {
        case 'rating':
          return metaB.rating - metaA.rating;
        case 'fastest':
          return metaA.deliveryTime - metaB.deliveryTime;
        case 'price_asc':
          return metaA.avgPrice - metaB.avgPrice;
        case 'price_desc':
          return metaB.avgPrice - metaA.avgPrice;
        case 'recommended':
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    restaurants,
    searchQuery,
    selectedCategory,
    filterUnder30,
    filterRating45,
    filterFreeDelivery,
    filterPrice,
    filterDietary,
    sortBy,
    ALL_CATEGORIES,
    getRestaurantMeta,
  ]);

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans w-full max-w-full overflow-x-hidden selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* ========================================================
          MOBILE VIEW (Stitch Screen: 77ac49bbef1f487ea16c5be3ac1c22fa)
          Active strictly on mobile display (md:hidden)
          ======================================================== */}
      <div className="md:hidden flex flex-col w-full min-h-screen bg-[#f7f9ff] text-[#161c23]">
        {/* Mobile Fixed Top Header */}
        <header className="fixed top-0 inset-x-0 z-50 bg-[#f7f9ff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-[#dde3ec]/40 pt-safe">
          <div className="h-14 px-3 sm:px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/" className="font-black text-xl tracking-tight text-[#ab2f00] select-none">
                Crave
              </Link>
              <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e9eef8] hover:bg-[#e3e8f2] transition cursor-pointer max-w-[150px]"
              >
                <MapPin className="w-3.5 h-3.5 text-[#ab2f00] shrink-0" />
                <span suppressHydrationWarning className="text-[11px] font-bold text-[#161c23] truncate">
                  {selectedAddress.addressLine || '742 Evergreen Terr...'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#5b4139] shrink-0" />
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                aria-label="Notifications"
                className="relative w-8 h-8 flex items-center justify-center rounded-full text-[#161c23] hover:bg-[#e9eef8] transition"
              >
                <Bell className="w-4 h-4 text-[#161c23]" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#ab2f00] ring-2 ring-[#f7f9ff]"></span>
              </button>
              <NavbarAuth />
            </div>
          </div>
        </header>

        {/* Mobile Main Body */}
        <main className="flex flex-col relative w-full pt-14 pb-20 bg-[#f7f9ff] min-h-screen">
          <div className="flex flex-col w-full space-y-3.5">
            {/* 1. Sub-Header Status Strip */}
            <section className="px-3 sm:px-4 pt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef4fe] shadow-sm">
                  <MapPin className="w-3 h-3 text-[#ab2f00] shrink-0" />
                  <span className="text-[10px] font-bold text-[#161c23] tracking-tight">Apt 4B Delivery</span>
                  <span className="text-[#5b4139] text-[9px] opacity-40">·</span>
                  <span className="text-[10px] text-[#006c49] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006c49] inline-block animate-pulse"></span>
                    20-30m
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#5b4139] px-2 py-0.5 rounded-full bg-[#e3e8f2]/60">
                <Flame className="w-3 h-3 text-[#ab2f00] shrink-0" />
                <span className="text-[10px] font-bold text-[#161c23]">Peak Lunch</span>
              </div>
            </section>

            {/* 2. Interactive Search Bar & Filter trigger */}
            <section className="px-3 sm:px-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden px-3 py-2 transition focus-within:shadow-md focus-within:border-[#ab2f00]/50">
                  <Search className="w-3.5 h-3.5 text-[#ab2f00] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, artisan kitchens, chef drops..."
                    className="w-full bg-transparent text-[11px] text-[#161c23] placeholder:text-[#5b4139]/70 focus:outline-none font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 mr-1 p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button aria-label="Voice Search" className="text-[#5b4139] hover:text-[#ab2f00] transition pl-1">
                    <Mic className="w-3.5 h-3.5 text-[#5b4139]" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  aria-label="Filter Options"
                  className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#161c23] hover:text-[#ab2f00] shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#161c23]" />
                </button>
              </div>
            </section>

            {/* 3. Category Filter Pills (Horizontal snap rail) */}
            <section>
              <div className="flex gap-1.5 px-3 sm:px-4 overflow-x-auto no-scrollbar scroll-smooth">
                {ALL_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(isActive && cat.name !== 'All' ? 'All' : cat.name);
                        const el = document.getElementById('mobile-explore-kitchens');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition flex items-center gap-1 active:scale-95 cursor-pointer ${
                        isActive
                          ? 'bg-[#ab2f00] text-white shadow-[#ab2f00]/25'
                          : 'bg-white text-[#161c23] hover:bg-[#e9eef8] border border-slate-100'
                      }`}
                    >
                      {cat.name === 'All' ? (
                        <Utensils className="w-3 h-3" />
                      ) : (
                        <span className="text-xs">{cat.icon}</span>
                      )}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. Epicurean Hero Drop Banner */}
            <section className="px-3 sm:px-4">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-[#2b3138] text-white">
                <div
                  className="bg-cover bg-center w-full h-52 relative"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80')`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2b3138] via-[#2b3138]/40 to-black/20" />
                  
                  {/* Badges on Hero */}
                  <div className="absolute top-2.5 inset-x-3 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-[#ab2f00] text-white text-[10px] tracking-wider uppercase font-extrabold shadow-sm">
                      Epicurean Drop
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2b3138]/80 backdrop-blur-md text-white shadow-sm">
                      <Clock className="w-3 h-3 text-[#ffb59d]" />
                      <span className="text-[10px] tracking-widest font-mono font-bold">{promoTimer}</span>
                    </div>
                  </div>

                  {/* Hero Content Bottom Overlay */}
                  <div className="absolute bottom-3 inset-x-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-[#ffdbd0] font-bold tracking-wide uppercase">Michelin Edition</span>
                    </div>
                    <h2 className="text-lg font-black text-white leading-tight mb-1">
                      Culinary Masterworks
                    </h2>
                    <p className="text-[11px] text-white/90 line-clamp-1 mb-2">
                      Zero delivery fee on hand-selected signature tasting courses.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center -space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#a73400] flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-[#2b3138]">3★</span>
                        <span className="w-5 h-5 rounded-full bg-[#ab2f00] flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-[#2b3138]">NYC</span>
                        <span className="w-5 h-5 rounded-full bg-[#006c49] flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-[#2b3138]">Bio</span>
                      </div>
                      <button
                        onClick={handleCopyPromo}
                        className="px-3.5 py-1.5 rounded-full bg-[#ab2f00] hover:bg-[#d53e02] text-white text-[11px] font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <span>Reserve Drop</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Trending Around You Header & Horizontal Shelf */}
            <section>
              <div className="px-3 sm:px-4 flex items-center justify-between mb-2.5">
                <div>
                  <h3 className="text-base font-bold text-[#161c23] tracking-tight">Trending Around You</h3>
                  <p className="text-[11px] text-[#5b4139]">Top-rated craft kitchens in your radius</p>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('mobile-explore-kitchens');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[#ab2f00] hover:text-[#d53e02] font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#ab2f00]" />
                </button>
              </div>

              {/* Cards Snap Carousel */}
              <div className="flex gap-3 px-3 sm:px-4 overflow-x-auto no-scrollbar scroll-smooth">
                {trendingRestaurants.map((restaurant, idx) => {
                  const badges = ['$0 Fee', 'Speedy', 'Free delivery', 'Chef Special'];
                  const times = ['20-30 min', '15-25 min', '25-35 min', '20-30 min'];
                  const ratings = ['4.9 (380+)', '4.8 (520)', '4.9 (410)', '4.7 (290)'];
                  const tags = ["Chef's Choice", 'Organic', 'Wild Caught', 'Artisan'];
                  const distances = ['1.2 mi', '$0.99 fee', '1.8 mi', '0.8 mi'];

                  const defaultImages = [
                    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
                  ];
                  const cardImg =
                    restaurant.categories?.[0]?.items?.[0]?.imageUrl ||
                    defaultImages[idx % defaultImages.length];

                  return (
                    <Link
                      key={restaurant.id}
                      href={`/restaurants/${restaurant.id}`}
                      className="w-48 sm:w-52 shrink-0 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group border border-slate-100 cursor-pointer"
                    >
                      <div className="relative w-full h-28 overflow-hidden bg-slate-100">
                        <img
                          src={cardImg}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#006c49] text-white text-[8px] font-bold">
                          {idx % 2 === 0 ? <Truck className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
                          <span>{badges[idx % 4]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          aria-label="Favorite kitchen"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/80 backdrop-blur-md text-[#161c23] flex items-center justify-center hover:text-[#ab2f00] transition-colors"
                        >
                          <Heart className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-white text-[8px] font-bold flex items-center gap-0.5">
                          <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                          <span>{ratings[idx % 4].split(' ')[0]}</span>
                          <span className="text-white/60 font-normal">{ratings[idx % 4].split(' ')[1]}</span>
                        </div>
                      </div>

                      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-xs font-bold text-[#161c23] leading-snug truncate group-hover:text-[#ab2f00] transition">
                            {restaurant.name}
                          </h4>
                          <p className="text-[10px] text-[#5b4139] truncate pt-0.5">
                            {restaurant.description || 'Artisan handcrafted gourmet specialties.'}
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[#5b4139]">
                          <div className="flex items-center gap-1 text-[9px]">
                            <Clock className="w-2.5 h-2.5 text-[#ab2f00]" />
                            <span className="font-bold text-[#161c23]">{times[idx % 4]}</span>
                            <span className="opacity-30">·</span>
                            <span>{distances[idx % 4]}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-full bg-[#ffdbd1] text-[#862300] text-[8px] font-bold">
                            {tags[idx % 4]}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 6. Guild Pass Membership Banner */}
            <section className="px-3 sm:px-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005236] via-[#006c49] to-[#6cf8bb] p-3.5 text-white shadow-md">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="pr-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Award className="w-3.5 h-3.5 text-[#6ffbbe]" />
                      <span className="text-[9px] uppercase tracking-widest text-[#6ffbbe] font-extrabold">CRAVE GUILD PASS</span>
                    </div>
                    <h4 className="text-sm font-bold leading-snug">
                      $0 Delivery on all orders
                    </h4>
                    <p className="text-[11px] text-[#4edea3] mt-0.5">
                      Exclusive chef drops &amp; members-only tasting menus.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAddedItemName('Crave Guild Pass Trial Activated!');
                      setTimeout(() => setAddedItemName(null), 3000);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white text-[#006c49] font-bold text-[11px] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Try Free
                  </button>
                </div>
                <div className="absolute -right-6 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
              </div>
            </section>

            {/* 7. Speedy Cravings (< 25 min) Fast Reorder Section */}
            <section className="px-3 sm:px-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00]">
                    <Zap className="w-3.5 h-3.5 text-[#ab2f00]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#161c23] tracking-tight">Speedy Cravings</h3>
                    <p className="text-[11px] text-[#5b4139]">Hot meals at your door in under 25 minutes</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#dde3ec] text-[#161c23] text-[9px] font-bold">Fast Lane</span>
              </div>

              {/* Speedy Stack */}
              <div className="space-y-2.5">
                {speedyItems.map((item, i) => {
                  const speedyItemId = `speedy-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                  const itemQty = cartItems
                    .filter((ci) => ci.menuItemId === speedyItemId || ci.name === item.name)
                    .reduce((sum, ci) => sum + ci.quantity, 0);

                  return (
                    <div key={i} className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 flex items-center gap-2.5">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-white text-[9px] font-bold">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-[#ffdbd0] text-[#390c00] text-[9px] font-bold uppercase">
                            {item.tag}
                          </span>
                          <span className="text-[11px] text-[#5b4139] truncate">{item.restaurant}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#161c23] truncate">{item.name}</h4>
                        <p className="text-[11px] text-[#ab2f00] font-bold mt-0.5">
                          ${item.price.toFixed(2)}{' '}
                          <span className="text-[#5b4139] font-normal opacity-70">· {item.sub}</span>
                        </p>
                      </div>

                      {itemQty === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleQuickAddSpeedy(item)}
                          aria-label={`Quick Add ${item.name}`}
                          className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center shadow-sm hover:bg-[#d53e02] active:scale-95 transition shrink-0 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      ) : (
                        <div className="h-7 px-1.5 rounded-full bg-[#ab2f00] text-white shadow-sm flex items-center justify-between gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const match = cartItems.find((ci) => ci.menuItemId === speedyItemId || ci.name === item.name);
                              if (match) updateQuantity(match.menuItemId, -1);
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/15 text-white active:scale-90 transition cursor-pointer"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <span className="font-extrabold text-[11px] text-white px-0.5">
                            {itemQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAddSpeedy(item)}
                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/15 text-white active:scale-90 transition cursor-pointer"
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 8. Curated Tasting Note Card / Moment of Delight (Afternoon Pairings) */}
            <section className="px-3 sm:px-4">
              <div className="bg-[#e9eef8] rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ab2f00]/10 flex items-center justify-center text-[#ab2f00] shrink-0">
                  <Coffee className="w-5 h-5 text-[#ab2f00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-[#161c23]">Afternoon Pairings Available</h5>
                  <p className="text-[11px] text-[#5b4139]">Single-origin cold brews match seamlessly with our warm pastry drops until 4 PM.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5b4139]/60 shrink-0" />
              </div>
            </section>

            {/* 9. Dynamic Live Kitchens / Filtered Results Feed */}
            <section id="mobile-explore-kitchens" className="px-3 sm:px-4 space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#161c23] tracking-tight">
                    {searchQuery
                      ? `Matching "${searchQuery}" (${filteredRestaurants.length})`
                      : selectedCategory !== 'All'
                      ? `${selectedCategory} (${filteredRestaurants.length})`
                      : `All Artisan Kitchens (${restaurants.length})`}
                  </h3>
                  <p className="text-[10px] text-[#5b4139]">Direct from local verified partners</p>
                </div>
                {(searchQuery || selectedCategory !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="text-[11px] font-bold text-[#ab2f00] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {filteredRestaurants.map((restaurant, idx) => {
                  const meta = getRestaurantMeta(restaurant);
                  const firstItem = restaurant.categories?.[0]?.items?.[0];
                  const cardImg =
                    firstItem?.imageUrl ||
                    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

                  return (
                    <Link
                      key={restaurant.id}
                      href={`/restaurants/${restaurant.id}`}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm p-2.5 flex gap-2.5 items-center group active:scale-[0.99] transition cursor-pointer"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={cardImg}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute bottom-1 right-1 px-1 rounded bg-black/75 text-white text-[8px] font-bold">
                          {meta.deliveryTime}m
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-[#161c23] group-hover:text-[#ab2f00] truncate">
                            {restaurant.name}
                          </h4>
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-white bg-[#006c49] px-1 py-0.2 rounded shrink-0">
                            ★ {meta.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5b4139] truncate pt-0.5">
                          {restaurant.description || 'Artisan handcrafted culinary creations.'}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-[#5b4139]">
                          <span className="font-bold text-[#006c49]">Free delivery</span>
                          <span>•</span>
                          <span className="truncate">{restaurant.address}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </main>

        {/* Mobile Fixed Bottom Navigation Bar (Stitch Match) */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#f7f9ff]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-[#dde3ec]/40 pb-safe">
          <div className="flex justify-around items-center h-14 px-3">
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-11 text-[#ab2f00] font-bold transition-colors"
            >
              <Compass className="w-5 h-5 text-[#ab2f00]" />
              <span className="text-[9px] tracking-wide font-bold">Explore</span>
            </Link>
            <button
              onClick={() => {
                const el = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (el) el.focus();
              }}
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-11 text-[#5b4139] hover:text-[#161c23] transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5 text-[#5b4139]" />
              <span className="text-[9px] tracking-wide font-medium">Search</span>
            </button>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-11 relative text-[#5b4139] hover:text-[#161c23] transition-colors"
            >
              <Clock className="w-5 h-5 text-[#5b4139]" />
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#006c49] ring-2 ring-[#f7f9ff]"></span>
              <span className="text-[9px] tracking-wide font-medium">Orders</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-11 text-[#5b4139] hover:text-[#161c23] transition-colors"
            >
              <User className="w-5 h-5 text-[#5b4139]" />
              <span className="text-[9px] tracking-wide font-medium">Profile</span>
            </Link>
          </div>
          <div className="flex justify-center items-center pb-1.5 pt-0.5 w-full">
            <div className="w-28 h-1 bg-[#161c23]/20 rounded-full"></div>
          </div>
        </nav>
      </div>

      {/* ========================================================
          DESKTOP VIEW (Active on md:flex and above)
          ======================================================== */}
      <div className="hidden md:flex flex-col w-full min-h-screen">
        {/* 1. TOP LIVE COURIER DISPATCH TICKER (DESKTOP ONLY) */}
        <div className="bg-[#fff1ed] border-b border-[#e4beb4]/40 text-[#ab2f00] text-[11px] font-semibold py-1.5 px-4 overflow-hidden">
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

            <div className="flex items-center gap-6 text-[#5b4139]">
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

        {/* 2. MAIN HEADER NAVIGATION BAR (DESKTOP) */}
        <header className="sticky top-0 z-40 bg-[#f7f9ff]/95 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.04)] w-full max-w-full">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <span className="font-serif font-black text-2xl tracking-tight text-[#161c23]">
                  Crave
                </span>
              </Link>

              {/* Deliver To Selector (Desktop) */}
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
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
            </div>

            {/* Zomato-Style Global Search Bar (Desktop) */}
            <div className="flex-1 max-w-lg mx-3 relative">
              <ZomatoSearchBar
                restaurants={restaurants}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            </div>

            {/* Actions: Cart Pill & NavbarAuth (Desktop) */}
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
        <section className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#181c20] text-white shadow-xl sm:shadow-2xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[300px] sm:min-h-[420px]">
            {/* Left Content */}
            <div className="lg:col-span-7 p-5 sm:p-10 lg:p-12 flex flex-col justify-between z-10 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#ab2f00] text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm">
                    <Star className="w-3 h-3 fill-current" /> Michelin Edition
                  </span>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-800/80 text-slate-300 text-[10px] sm:text-[11px] font-semibold rounded-full border border-slate-700">
                    Valid until Sunday midnight
                  </span>
                </div>

                <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.2]">
                  Free delivery on culinary masterworks this week
                </h1>

                <p className="text-slate-300 text-xs sm:text-base max-w-xl font-normal leading-relaxed">
                  Savor seasonal menus hand-crafted by neighborhood awardees. Zero delivery fees on curated orders over ₹400.
                </p>
              </div>

              {/* Promo code & Countdown */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 sm:pt-2">
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-mono">
                  <span className="text-slate-400 font-sans text-[10px] sm:text-[11px] uppercase tracking-wider">PROMO:</span>
                  <strong className="text-white tracking-widest text-xs sm:text-sm">EPICUREAN</strong>
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

                <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900/70 border border-slate-800 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-[#ab2f00]" />
                  <span>47h : 29m : 09s</span>
                </div>
              </div>

              {/* CTA & Social Proof */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-1 sm:pt-2">
                <Link
                  href="#trending"
                  className="bg-[#ab2f00] hover:bg-[#8f2700] text-white px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#ab2f00]/30 transition group"
                >
                  <span>Claim Offer & Browse</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 border-2 border-[#181c20] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                      ID
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-600 border-2 border-[#181c20] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                      AA
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-600 border-2 border-[#181c20] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                      MS
                    </div>
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    <strong className="text-white">540+</strong> orders today
                  </span>
                </div>
              </div>
            </div>

            {/* Right Gourmet Visual with Floating Chef Badge */}
            <div className="lg:col-span-5 relative h-48 sm:h-64 lg:h-auto lg:min-h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80"
                alt="L'Atelier Charcoal Wagyu"
                className="w-full h-full object-cover object-center transform scale-105 hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181c20] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#181c20] lg:via-transparent lg:to-transparent" />

              {/* Floating Chef Highlight Badge */}
              <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-20 bg-white/95 backdrop-blur-md text-[#161c23] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl flex items-center gap-2 sm:gap-3 border border-slate-100 max-w-xs">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center font-bold">
                  <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#ab2f00] block">
                    CHEF HIGHLIGHT
                  </span>
                  <span className="text-[11px] sm:text-xs font-extrabold leading-tight block">
                    L&apos;Atelier Charcoal Wagyu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EXPLORE CATEGORIES BAR */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#161c23]">
              Explore Categories
            </h2>
            <button
              type="button"
              onClick={() => setIsAllCategoriesExpanded((prev) => !prev)}
              className="text-xs font-bold text-[#ab2f00] hover:underline flex items-center gap-1 transition cursor-pointer"
            >
              <span>{isAllCategoriesExpanded ? 'Show Less' : 'View All 24'}</span>
              {isAllCategoriesExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
            {(isAllCategoriesExpanded ? ALL_CATEGORIES : ALL_CATEGORIES.slice(0, 8)).map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    const el = document.getElementById('explore-kitchens');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-[#ab2f00] text-white border-[#ab2f00] shadow-md shadow-[#ab2f00]/25 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. FILTER & SORT CHIP BAR */}
        <section className="relative z-30 pb-2">
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar touch-pan-x py-1">
            <div className="flex items-center gap-2 shrink-0">
              {/* 1. Filters Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition font-semibold cursor-pointer shrink-0 ${
                  activeFilterCount > 0
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </button>

              {/* 2. Under 30 mins chip */}
              {filterUnder30 ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ffdbd1]/60 text-[#ab2f00] border border-[#ab2f00]/30 font-bold transition shadow-sm animate-in fade-in shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[#ab2f00]" />
                  <button
                    type="button"
                    onClick={() => setFilterUnder30(false)}
                    className="hover:underline cursor-pointer"
                  >
                    Under 30 mins
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterUnder30(false)}
                    className="hover:bg-[#ab2f00]/15 rounded-full p-0.5 ml-0.5 transition cursor-pointer"
                    title="Remove Under 30 mins filter"
                  >
                    <X className="w-3 h-3 text-[#ab2f00]" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilterUnder30(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Under 30 mins</span>
                </button>
              )}

              {/* 3. Rating 4.5+ chip */}
              {filterRating45 ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold transition shadow-sm animate-in fade-in shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <button
                    type="button"
                    onClick={() => setFilterRating45(false)}
                    className="hover:underline cursor-pointer"
                  >
                    Rating 4.5+
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRating45(false)}
                    className="hover:bg-amber-200/60 rounded-full p-0.5 ml-0.5 transition cursor-pointer"
                    title="Remove Rating 4.5+ filter"
                  >
                    <X className="w-3 h-3 text-amber-900" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilterRating45(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Rating 4.5+</span>
                </button>
              )}

              {/* 4. Free Delivery chip */}
              {filterFreeDelivery ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-[#006c49] border border-emerald-300 font-bold transition shadow-sm animate-in fade-in shrink-0">
                  <Truck className="w-3.5 h-3.5 text-[#006c49]" />
                  <button
                    type="button"
                    onClick={() => setFilterFreeDelivery(false)}
                    className="hover:underline cursor-pointer"
                  >
                    Free Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterFreeDelivery(false)}
                    className="hover:bg-emerald-200/60 rounded-full p-0.5 ml-0.5 transition cursor-pointer"
                    title="Remove Free Delivery filter"
                  >
                    <X className="w-3 h-3 text-[#006c49]" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilterFreeDelivery(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
                >
                  <Truck className="w-3.5 h-3.5 text-[#006c49]" />
                  <span>Free Delivery</span>
                </button>
              )}

              {/* 5. Price ($$) chip & popover */}
              <div className="relative shrink-0" data-dropdown="price">
                {filterPrice !== 'all' ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold transition shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPriceDropdownOpen((prev) => !prev);
                        setIsDietaryDropdownOpen(false);
                        setIsSortDropdownOpen(false);
                      }}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <span>Price ({filterPrice})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterPrice('all');
                        setIsPriceDropdownOpen(false);
                      }}
                      className="hover:bg-slate-200 rounded-full p-0.5 ml-0.5 transition cursor-pointer"
                      title="Clear price filter"
                    >
                      <X className="w-3 h-3 text-slate-700" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPriceDropdownOpen((prev) => !prev);
                      setIsDietaryDropdownOpen(false);
                      setIsSortDropdownOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>Price</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                {/* Price Dropdown Popover */}
                {isPriceDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    {[
                      { val: 'all', label: 'Any Price', sub: 'Show all price levels' },
                      { val: '$', label: '$ • Budget', sub: 'Under ₹250 avg' },
                      { val: '$$', label: '$$ • Moderate', sub: '₹250 - ₹600 avg' },
                      { val: '$$$', label: '$$$ • Fine Dining', sub: '₹600+ avg' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          setFilterPrice(opt.val as any);
                          setIsPriceDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          filterPrice === opt.val
                            ? 'text-[#ab2f00] font-bold bg-[#ffdbd1]/20'
                            : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{opt.label}</p>
                          <p className="text-[10px] text-slate-400">{opt.sub}</p>
                        </div>
                        {filterPrice === opt.val && (
                          <Check className="w-3.5 h-3.5 text-[#ab2f00]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Dietary chip & popover */}
              <div className="relative shrink-0" data-dropdown="dietary">
                {filterDietary !== 'all' ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-[#006c49] border border-emerald-300 font-bold transition shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDietaryDropdownOpen((prev) => !prev);
                        setIsPriceDropdownOpen(false);
                        setIsSortDropdownOpen(false);
                      }}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Leaf className="w-3.5 h-3.5 text-[#006c49]" />
                      <span>
                        {filterDietary === 'vegan'
                          ? 'Dietary: Vegan'
                          : filterDietary === 'gf'
                          ? 'Dietary: GF'
                          : 'Dietary: Pure Veg'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDietary('all');
                        setIsDietaryDropdownOpen(false);
                      }}
                      className="hover:bg-emerald-200/60 rounded-full p-0.5 ml-0.5 transition cursor-pointer"
                      title="Clear dietary filter"
                    >
                      <X className="w-3 h-3 text-[#006c49]" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDietaryDropdownOpen((prev) => !prev);
                      setIsPriceDropdownOpen(false);
                      setIsSortDropdownOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Leaf className="w-3.5 h-3.5 text-[#006c49]" />
                    <span>Dietary (Vegan, GF)</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                {/* Dietary Dropdown Popover */}
                {isDietaryDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-52 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    {[
                      { val: 'all', label: 'All Diets', sub: 'No restrictions' },
                      { val: 'vegan', label: '🌱 Vegan Friendly', sub: 'Plant-based selections' },
                      { val: 'gf', label: '🌾 Gluten-Free (GF)', sub: 'Gluten-conscious items' },
                      { val: 'veg', label: '🥬 100% Vegetarian', sub: 'Meatless & pure veg' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          setFilterDietary(opt.val as any);
                          setIsDietaryDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          filterDietary === opt.val
                            ? 'text-[#006c49] font-bold bg-emerald-50'
                            : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{opt.label}</p>
                          <p className="text-[10px] text-slate-400">{opt.sub}</p>
                        </div>
                        {filterDietary === opt.val && (
                          <Check className="w-3.5 h-3.5 text-[#006c49]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 7. Sort Dropdown */}
            <div className="relative shrink-0 ml-auto" data-dropdown="sort">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                <span>Sort:</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen((prev) => !prev);
                    setIsPriceDropdownOpen(false);
                    setIsDietaryDropdownOpen(false);
                  }}
                  className="font-bold text-[#161c23] hover:text-[#ab2f00] flex items-center gap-1 transition cursor-pointer"
                >
                  <span>
                    {sortBy === 'recommended'
                      ? 'Recommended'
                      : sortBy === 'rating'
                      ? 'Rating 4.5+'
                      : sortBy === 'fastest'
                      ? 'Fastest Delivery'
                      : sortBy === 'price_asc'
                      ? 'Price: Low to High'
                      : 'Price: High to Low'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {[
                    { val: 'recommended', label: 'Recommended', sub: 'Best match & curated picks' },
                    { val: 'rating', label: 'Rating: High to Low', sub: 'Highest rated kitchens (4.9 ★)' },
                    { val: 'fastest', label: 'Fastest Delivery', sub: 'Fastest arrival time first' },
                    { val: 'price_asc', label: 'Price: Low to High', sub: 'Affordable options first' },
                    { val: 'price_desc', label: 'Price: High to Low', sub: 'Fine dining & premium first' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.val as any);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        sortBy === opt.val
                          ? 'text-[#ab2f00] font-bold bg-[#ffdbd1]/20'
                          : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-[10px] text-slate-400">{opt.sub}</p>
                      </div>
                      {sortBy === opt.val && (
                        <Check className="w-3.5 h-3.5 text-[#ab2f00]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filter Modal Dialog */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden" />
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#ab2f00]" />
                  <h3 className="text-base font-black text-slate-900">
                    Filter Restaurants {activeFilterCount > 0 ? `(${activeFilterCount} active)` : ''}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Options */}
              <div className="space-y-4 text-xs">
                {/* 1. Delivery speed */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Delivery Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterUnder30(false)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        !filterUnder30 ? 'bg-[#161c23] text-white border-[#161c23]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Any Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterUnder30(true)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        filterUnder30 ? 'bg-[#ab2f00] text-white border-[#ab2f00]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ⚡ Under 30 mins
                    </button>
                  </div>
                </div>

                {/* 2. Rating */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Customer Rating</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterRating45(false)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        !filterRating45 ? 'bg-[#161c23] text-white border-[#161c23]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Any Rating
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterRating45(true)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        filterRating45 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ⭐ 4.5+ Stars Only
                    </button>
                  </div>
                </div>

                {/* 3. Delivery fee */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Delivery Fee</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterFreeDelivery(false)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        !filterFreeDelivery ? 'bg-[#161c23] text-white border-[#161c23]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterFreeDelivery(true)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        filterFreeDelivery ? 'bg-[#006c49] text-white border-[#006c49]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🚚 Free Delivery Only
                    </button>
                  </div>
                </div>

                {/* 4. Price tier */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Price Range</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: 'all', label: 'Any' },
                      { val: '$', label: '$ (<₹250)' },
                      { val: '$$', label: '$$ (Mid)' },
                      { val: '$$$', label: '$$$ (Fine)' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setFilterPrice(p.val as any)}
                        className={`py-2 rounded-xl border text-center font-bold transition text-[11px] cursor-pointer ${
                          filterPrice === p.val
                            ? 'bg-[#ab2f00] text-white border-[#ab2f00]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Dietary */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Dietary Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'all', label: 'All Diets' },
                      { val: 'vegan', label: '🌱 Vegan' },
                      { val: 'gf', label: '🌾 Gluten-Free' },
                      { val: 'veg', label: '🥬 100% Vegetarian' },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setFilterDietary(d.val as any)}
                        className={`p-2 rounded-xl border text-center font-bold transition text-[11px] cursor-pointer ${
                          filterDietary === d.val
                            ? 'bg-[#006c49] text-white border-[#006c49]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilterUnder30(false);
                    setFilterRating45(false);
                    setFilterFreeDelivery(false);
                    setFilterPrice('all');
                    setFilterDietary('all');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-red-600 transition cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-md shadow-[#ab2f00]/25 transition cursor-pointer"
                >
                  Show {filteredRestaurants.length} Kitchens
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
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

        {/* 8. ALL REGISTERED KITCHENS / SEARCH RESULTS SECTION */}
        <section id="explore-kitchens" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#ab2f00] block">
                  {searchQuery || selectedCategory !== 'All' || activeFilterCount > 0 ? 'FILTERED RESULTS' : 'EXPLORE ALL KITCHENS'}
                </span>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                    {activeFilterCount} active filters
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-[#161c23] tracking-tight">
                {searchQuery
                  ? `Kitchens matching "${searchQuery}" (${filteredRestaurants.length})`
                  : selectedCategory !== 'All'
                  ? `${selectedCategory} Kitchens (${filteredRestaurants.length})`
                  : activeFilterCount > 0
                  ? `Kitchens matching your filters (${filteredRestaurants.length})`
                  : `All Culinary Kitchens (${restaurants.length})`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(activeFilterCount > 0 || selectedCategory !== 'All' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setFilterUnder30(false);
                    setFilterRating45(false);
                    setFilterFreeDelivery(false);
                    setFilterPrice('all');
                    setFilterDietary('all');
                    setSortBy('recommended');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Live from PostgreSQL database • Real-time kitchen status
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 p-4 animate-pulse space-y-3">
                  <div className="aspect-[4/3] bg-slate-200 rounded-2xl w-full" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center mx-auto">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No restaurants match your filters</h3>
              <p className="text-xs text-slate-500">
                Try toggling off &quot;Under 30 mins&quot;, changing the price range, or clearing filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setFilterUnder30(false);
                  setFilterRating45(false);
                  setFilterFreeDelivery(false);
                  setFilterPrice('all');
                  setFilterDietary('all');
                  setSortBy('recommended');
                  if (restaurants.length === 0) fetchRealRestaurants();
                }}
                className="px-4 py-2 bg-[#ab2f00] text-white rounded-xl text-xs font-bold hover:bg-[#8f2700] transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredRestaurants.map((restaurant, idx) => {
                const meta = getRestaurantMeta(restaurant);
                const firstCat = restaurant.categories?.[0];
                const firstItem = firstCat?.items?.[0];
                const defaultImages = [
                  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
                ];
                const cardImage = firstItem?.imageUrl || defaultImages[idx % defaultImages.length];

                const totalItemsCount = restaurant.categories
                  ? restaurant.categories.reduce((acc, c) => acc + c.items.length, 0)
                  : 0;

                return (
                  <div
                    key={restaurant.id}
                    className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <Link
                      href={`/restaurants/${restaurant.id}`}
                      className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100 block"
                    >
                      <img
                        src={cardImage}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm bg-slate-900/90 backdrop-blur text-white">
                          {restaurant.status === 'APPROVED' ? 'VERIFIED KITCHEN' : restaurant.status}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#ffdbd1]" />
                        <span>{meta.deliveryTime} mins</span>
                      </div>
                    </Link>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/restaurants/${restaurant.id}`}
                            className="font-extrabold text-base text-[#161c23] group-hover:text-[#ab2f00] transition truncate"
                          >
                            {restaurant.name}
                          </Link>
                          <span className="flex items-center gap-0.5 text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{meta.rating.toFixed(1)}</span>
                          </span>
                        </div>

                        {/* Badges for Price & Free Delivery */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {meta.priceLevel === '$' ? '$ Budget' : meta.priceLevel === '$$' ? '$$ Moderate' : '$$$ Fine Dining'}
                          </span>
                          {meta.hasFreeDelivery && (
                            <span className="text-[10px] font-extrabold text-[#006c49] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Truck className="w-3 h-3 text-[#006c49]" />
                              <span>Free Delivery</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {restaurant.description || 'Artisan handcrafted culinary creations.'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          📍 {restaurant.address}
                        </p>
                      </div>

                      <div className="pt-3">
                        <Link
                          href={`/restaurants/${restaurant.id}`}
                          className="w-full py-2.5 text-center text-xs font-bold text-[#ab2f00] bg-[#ffdbd1]/50 hover:bg-[#ffdbd1] rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Visit Menu ({totalItemsCount} items)</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 9. TRUST & CURATION PROPS */}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-2xl w-full max-h-[88vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
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

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setCustomizingItem({ item, restaurant: selectedRestaurant })}
                            className="bg-[#ffdbd1] hover:bg-[#ffb59f] text-[#ab2f00] px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            Customize
                          </button>
                          <button
                            onClick={() => handleAddToCart(selectedRestaurant, item)}
                            className="bg-[#ab2f00] hover:bg-[#8f2700] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
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
            <Link
              href="/stitch/projects/5230722148065772942/screens/62b846e0df9b472287f65cc4b3f3a774"
              className="text-[#ab2f00] hover:underline font-bold flex items-center gap-1 bg-[#ffdbd1]/60 px-2 py-0.5 rounded-md"
            >
              <span>🍜 Mobile Dish Customizer (Stitch)</span>
            </Link>
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
      </div>

      {/* Floating Add-to-Cart Toast (Shared) */}
      {addedItemName && (
        <div className="fixed bottom-24 right-4 z-50 bg-[#161c23] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
          <div>
            <p className="text-xs font-bold">Added to cart!</p>
            <p className="text-[11px] text-slate-400">{addedItemName}</p>
          </div>
        </div>
      )}

      {/* Dish Customizer Modal */}
      {customizingItem && (
        <DishCustomizerModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          item={customizingItem.item}
          restaurantId={customizingItem.restaurant.id}
          restaurantName={customizingItem.restaurant.name}
          currencySymbol="₹"
          onAddToCart={({ menuItemId, name, pricePaise, imageUrl, quantity }) => {
            addItem(
              customizingItem.restaurant.id,
              customizingItem.restaurant.name,
              {
                menuItemId: `${menuItemId}-${Date.now()}`,
                name,
                pricePaise,
                imageUrl,
              },
              quantity
            );
            setAddedItemName(name);
            setTimeout(() => setAddedItemName(null), 2500);
          }}
        />
      )}

      {/* Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
