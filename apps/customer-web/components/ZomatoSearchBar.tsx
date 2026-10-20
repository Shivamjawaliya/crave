'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  UtensilsCrossed,
  Store,
  Tag,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';

export interface SearchMenuItem {
  id: string;
  categoryId?: string;
  name: string;
  description: string | null;
  pricePaise: number;
  imageUrl: string | null;
  isAvailable?: boolean;
  dietaryType?: string | null;
}

export interface SearchMenuCategory {
  id: string;
  restaurantId?: string;
  name: string;
  sortOrder?: number;
  items: SearchMenuItem[];
}

export interface SearchRestaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  categories: SearchMenuCategory[];
}

interface ZomatoSearchBarProps {
  restaurants: SearchRestaurant[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectCategory?: (category: string) => void;
  className?: string;
  placeholder?: string;
}

const POPULAR_CUISINES = [
  { label: 'Artisan Pizza', icon: '🍕', category: 'Artisan Pizza' },
  { label: 'Ramen & Bowls', icon: '🍜', category: 'Ramen & Bowls' },
  { label: 'Gourmet Burgers', icon: '🍔', category: 'Gourmet Burgers' },
  { label: 'Sushi & Poke', icon: '🍣', category: 'Sushi & Poke' },
  { label: 'Healthy & Greens', icon: '🥗', category: 'Healthy & Greens' },
  { label: 'Bakery & Dessert', icon: '🥐', category: 'Bakery & Dessert' },
  { label: 'Mexican Tacos', icon: '🌮', query: 'Tacos' },
  { label: 'Juices & Shakes', icon: '🍹', query: 'Juice' },
];

export default function ZomatoSearchBar({
  restaurants,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  className = '',
  placeholder = "Search 'pizza', 'ramen', 'burgers' or kitchens...",
}: ZomatoSearchBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K or / to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute live search matches across dishes, restaurants, and categories
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { dishes: [], restaurants: [], categories: [] };
    }

    const matchedDishes: {
      dish: SearchMenuItem;
      restaurant: SearchRestaurant;
      categoryName: string;
    }[] = [];

    const matchedRestaurants: SearchRestaurant[] = [];
    const matchedCategoriesSet = new Map<string, { name: string; count: number }>();

    for (const rest of restaurants) {
      const restNameMatch = rest.name.toLowerCase().includes(q);
      const restDescMatch = rest.description?.toLowerCase().includes(q);
      const restAddrMatch = rest.address?.toLowerCase().includes(q);

      if (restNameMatch || restDescMatch || restAddrMatch) {
        matchedRestaurants.push(rest);
      }

      for (const cat of rest.categories || []) {
        const catNameMatch = cat.name.toLowerCase().includes(q);
        if (catNameMatch) {
          const existing = matchedCategoriesSet.get(cat.name);
          matchedCategoriesSet.set(cat.name, {
            name: cat.name,
            count: (existing?.count || 0) + (cat.items?.length || 0),
          });
        }

        for (const item of cat.items || []) {
          const itemNameMatch = item.name.toLowerCase().includes(q);
          const itemDescMatch = item.description?.toLowerCase().includes(q);

          if (itemNameMatch || itemDescMatch || catNameMatch) {
            matchedDishes.push({
              dish: item,
              restaurant: rest,
              categoryName: cat.name,
            });
          }
        }
      }
    }

    return {
      dishes: matchedDishes.slice(0, 6),
      restaurants: matchedRestaurants.slice(0, 5),
      categories: Array.from(matchedCategoriesSet.values()).slice(0, 4),
    };
  }, [restaurants, searchQuery]);

  const hasQuery = searchQuery.trim().length > 0;
  const hasResults =
    searchResults.dishes.length > 0 ||
    searchResults.restaurants.length > 0 ||
    searchResults.categories.length > 0;

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSelectPopularCuisine = (item: {
    label: string;
    category?: string;
    query?: string;
  }) => {
    if (item.category && onSelectCategory) {
      onSelectCategory(item.category);
      setSearchQuery('');
    } else if (item.query) {
      setSearchQuery(item.query);
    } else {
      setSearchQuery(item.label);
    }
    setIsOpen(false);
  };

  const handleSelectDish = (
    restaurantId: string,
    dishId: string
  ) => {
    setIsOpen(false);
    router.push(`/restaurants/${restaurantId}#dish-${dishId}`);
  };

  const handleSelectRestaurant = (restaurantId: string) => {
    setIsOpen(false);
    router.push(`/restaurants/${restaurantId}`);
  };

  const handleSelectCategory = (catName: string) => {
    setSearchQuery(catName);
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#ab2f00] absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-16 py-2.5 sm:py-3 bg-white text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200/90 focus:border-[#ab2f00] outline-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:shadow-[0_4px_16px_rgba(171,47,0,0.12)] transition-all placeholder:text-slate-400 placeholder:font-normal"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {hasQuery ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 pointer-events-none">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Live Dropdown Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 overflow-hidden max-h-[65vh] sm:max-h-[480px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {/* STATE A: No query typed yet -> Show Popular Cuisines & Top Kitchens */}
          {!hasQuery ? (
            <div className="space-y-4 px-3 sm:px-4 py-1">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
                  <Flame className="w-3.5 h-3.5 text-[#ab2f00]" />
                  <span>Popular Cuisines & Trends</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CUISINES.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectPopularCuisine(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-[#ffdbd1]/40 hover:text-[#ab2f00] border border-slate-200/70 text-xs font-semibold text-slate-700 transition active:scale-95"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {restaurants.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Top Rated Kitchens</span>
                  </div>
                  <div className="space-y-1">
                    {restaurants.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRestaurant(r.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#ffdbd1]/50 text-[#ab2f00] flex items-center justify-center shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#ab2f00] truncate">
                              {r.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {r.address || 'Gourmet Kitchen'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#ab2f00] group-hover:translate-x-0.5 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !hasResults ? (
            /* STATE B: Query typed but no matches */
            <div className="px-6 py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  No matches found for &quot;{searchQuery}&quot;
                </p>
                <p className="text-[11px] text-slate-500">
                  Try searching for dishes like &quot;Ramen&quot;, &quot;Pizza&quot;, &quot;Burger&quot;, or restaurant names.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {['Pizza', 'Ramen', 'Burgers', 'Sushi'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* STATE C: Query typed with live categorized matches */
            <div className="divide-y divide-slate-100">
              {/* 1. DISHES */}
              {searchResults.dishes.length > 0 && (
                <div className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#ab2f00]" />
                    <span>Dishes ({searchResults.dishes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.dishes.map(({ dish, restaurant, categoryName }) => (
                      <button
                        key={`${restaurant.id}-${dish.id}`}
                        type="button"
                        onClick={() => handleSelectDish(restaurant.id, dish.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#ab2f00] truncate">
                              {dish.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              at <strong className="font-semibold text-slate-700">{restaurant.name}</strong> • {categoryName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          <span className="text-xs font-black text-[#ab2f00]">
                            ₹{(dish.pricePaise / 100).toFixed(0)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. RESTAURANTS */}
              {searchResults.restaurants.length > 0 && (
                <div className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    <Store className="w-3.5 h-3.5 text-blue-600" />
                    <span>Restaurants ({searchResults.restaurants.length})</span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.restaurants.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        type="button"
                        onClick={() => handleSelectRestaurant(restaurant.id)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-xs">
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#ab2f00] truncate">
                              {restaurant.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {restaurant.address || 'Gourmet Kitchen'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-[#ab2f00]">
                          <span className="text-[10px] font-bold">View Menu</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CATEGORIES & CUISINES */}
              {searchResults.categories.length > 0 && (
                <div className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Cuisines & Categories ({searchResults.categories.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {searchResults.categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleSelectCategory(cat.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition border border-purple-200/60"
                      >
                        <Tag className="w-3 h-3 text-purple-600" />
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-purple-500 font-semibold">
                          ({cat.count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
