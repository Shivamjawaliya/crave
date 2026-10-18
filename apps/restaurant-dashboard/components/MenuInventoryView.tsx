'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  RefreshCw,
  Ban,
} from 'lucide-react';
import AddDishModal from './AddDishModal';
import LiveItemInspector, { InspectorItem } from './LiveItemInspector';

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

export interface MenuCategoryData {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemData[];
}

interface MenuInventoryViewProps {
  restaurantId: string;
  categories: MenuCategoryData[];
  onRefreshData: () => void;
}

export default function MenuInventoryView({
  restaurantId,
  categories,
  onRefreshData,
}: MenuInventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('All');
  const [filter86Only, setFilter86Only] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InspectorItem | null>(null);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // Compute all items
  const allItems = useMemo(() => {
    return categories.flatMap((c) =>
      c.items.map((item) => ({ ...item, categoryId: c.id }))
    );
  }, [categories]);

  // Compute total 86'd items
  const count86 = useMemo(() => {
    return allItems.filter((i) => !i.isAvailable).length;
  }, [allItems]);

  // Filtered categories and items
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        let items = cat.items.map((i) => ({ ...i, categoryId: cat.id }));

        if (selectedCategoryName !== 'All' && cat.name !== selectedCategoryName) {
          return null;
        }

        if (filter86Only) {
          items = items.filter((i) => !i.isAvailable);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const skuMatch = (id: string) => `sku-${id.slice(-4)}`.includes(q);
          items = items.filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.description?.toLowerCase().includes(q) ||
              skuMatch(i.id)
          );
        }

        return { ...cat, items };
      })
      .filter((c): c is MenuCategoryData => Boolean(c && c.items.length > 0));
  }, [categories, selectedCategoryName, filter86Only, searchQuery]);

  // Handle availability toggle
  const handleToggleAvailability = async (item: MenuItemData) => {
    setTogglingItemId(item.id);
    const newStatus = !item.isAvailable;

    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      const res = await fetch(
        `${gatewayUrl}/restaurants/items/${item.id}/availability`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAvailable: newStatus }),
        }
      );

      if (res.ok) {
        onRefreshData();
      }
    } catch (e) {
      console.error('Failed to toggle item availability:', e);
    } finally {
      setTogglingItemId(null);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Main Catalog Column */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Top Header & SKU Control */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-secondary uppercase tracking-wider mb-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>Live Kitchen Catalog & SKU Control</span>
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">
              Menu Catalog & Real-Time 86 Inventory
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter86Only(!filter86Only)}
              className={`h-9 px-4 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shadow-sm border ${
                filter86Only
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-white text-on-surface hover:bg-surface-container border-surface-container-high'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{filter86Only ? 'Showing 86\'d Items' : 'Bulk 86 / Stock Out'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddDishOpen(true)}
              className="h-9 px-4 bg-primary text-white hover:bg-primary-container transition font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Dish</span>
            </button>
          </div>
        </div>

        {/* Active Broadcast Sync Strip */}
        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-xs text-on-surface font-medium">
              All inventory updates propagate automatically to customer app, kiosk, and dispatch rails.
            </span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant text-[11px] font-mono">
            <span className="flex items-center gap-1 text-primary font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> POS Sync Active: 12ms latency
            </span>
            <span className="text-surface-container-highest">/</span>
            <span className="font-semibold text-primary">TERMINAL_ID #KDS-01-ACTIVE</span>
          </div>
        </div>

        {/* Emergency Kitchen 86 Board */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-sm text-on-surface">Emergency Kitchen 86 Board</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono font-medium">
                Live Recipe Links
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Triggers automated stock guard on linked dishes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Critical Card */}
            <div className="p-3.5 bg-white rounded-xl border border-secondary/30 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold block">
                    CRITICAL DEPLETION
                  </span>
                  <h4 className="font-bold text-xs text-on-surface pt-0.5">
                    Avocado & Green Produce
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-secondary text-white font-mono text-[10px] font-bold rounded">
                  86&apos;D / SOLD OUT
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Linked: Super-Green Detox, Avocado Spinach Energy Blend
              </p>
              <div className="flex items-center gap-1 text-[11px] text-secondary font-semibold pt-1">
                <Clock className="w-3 h-3" />
                <span>Auto-reinstate: Tomorrow 09:00 AM</span>
              </div>
            </div>

            {/* Threshold Card */}
            <div className="p-3.5 bg-white rounded-xl border border-surface-container-high shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                    THRESHOLD GUARD
                  </span>
                  <h4 className="font-bold text-xs text-on-surface pt-0.5">
                    Organic Soaked Chia Seeds
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] font-bold rounded">
                  LOW: 14 PORTIONS
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full w-[25%]"></div>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Shift Allocation: 75% depleted across morning rush
              </p>
            </div>

            {/* In Stock Card */}
            <div className="p-3.5 bg-white rounded-xl border border-primary/20 shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold block">
                    BATCH VERIFIED
                  </span>
                  <h4 className="font-bold text-xs text-on-surface pt-0.5">
                    Fresh Valencia Oranges & Ginger
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-mono text-[10px] font-bold rounded">
                  IN STOCK
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Cold-press crate stock: 45 kg washed & prepped for dispatch
              </p>
              <div className="flex items-center gap-1 text-[11px] text-primary font-semibold pt-1">
                <CheckCircle className="w-3 h-3" />
                <span>Line readiness: 100% capacity</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar & Filter Strip */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, ingredients, modifiers, tags, SKUs..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter86Only(!filter86Only)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1 shadow-sm ${
                  filter86Only
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white text-on-surface border-surface-container hover:bg-surface-container'
                }`}
              >
                <span>Only 86&apos;d ({count86})</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategoryName('All')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shadow-sm ${
                selectedCategoryName === 'All'
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface-variant hover:bg-surface-container border border-surface-container'
              }`}
            >
              All Items ({allItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryName(c.name)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap shadow-sm ${
                  selectedCategoryName === c.name
                    ? 'bg-primary text-white'
                    : 'bg-white text-on-surface-variant hover:bg-surface-container border border-surface-container'
                }`}
              >
                {c.name} ({c.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Categorized Dish Lists */}
        <div className="space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-surface-container shadow-sm space-y-2">
              <AlertTriangle className="w-8 h-8 text-on-surface-variant mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-on-surface">No dishes match criteria</h3>
              <p className="text-xs text-on-surface-variant">Try clearing the search query or 86 filter.</p>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const activeCount = cat.items.filter((i) => i.isAvailable).length;

              return (
                <section key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-sm text-on-surface">{cat.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[11px] font-medium">
                        {activeCount} of {cat.items.length} Items Active
                      </span>
                    </div>
                  </div>

                  {/* List of Dishes */}
                  <div className="space-y-2">
                    {cat.items.map((item) => {
                      const sku = `SKU-${item.id.slice(-4).toUpperCase()}`;
                      const isSelected = selectedItem?.id === item.id;
                      const isToggling = togglingItemId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-xl p-3 border transition flex items-center justify-between gap-4 shadow-sm cursor-pointer ${
                            isSelected
                              ? 'border-primary ring-1 ring-primary'
                              : 'border-surface-container hover:border-surface-container-high'
                          } ${!item.isAvailable ? 'opacity-80 bg-slate-50/70' : ''}`}
                          onClick={() => setSelectedItem(item)}
                        >
                          {/* Left: Thumbnail & Dish Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className={`w-14 h-14 rounded-lg object-cover shrink-0 ${
                                  !item.isAvailable ? 'grayscale' : ''
                                }`}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0 font-bold text-xs">
                                {item.name.charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-xs text-on-surface truncate">
                                  {item.name}
                                </h4>
                                {item.isAvailable ? (
                                  <span className="px-2 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-mono font-bold">
                                    AVAILABLE
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.2 rounded bg-secondary text-white text-[10px] font-mono font-bold">
                                    86&apos;D SOLD OUT
                                  </span>
                                )}
                                <span className="font-mono text-[10px] text-on-surface-variant">
                                  #{sku}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-medium">
                                <span className="font-bold text-on-surface font-mono">
                                  ₹{(item.pricePaise / 100).toFixed(2)}
                                </span>
                                <span>• Prep: 12 min</span>
                                <span>• 28 sold today</span>
                              </div>

                              <p className="text-[11px] text-on-surface-variant/80 line-clamp-1">
                                {item.description || 'Prepared fresh upon order placement.'}
                              </p>
                            </div>
                          </div>

                          {/* Right: Live in Kitchen Toggle */}
                          <div
                            className="flex items-center gap-4 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                                {item.isAvailable ? 'Live in Kitchen' : 'Stock Depleted'}
                              </span>
                              <div className="flex items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  disabled={isToggling}
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                                    item.isAvailable ? 'bg-primary' : 'bg-slate-300'
                                  }`}
                                >
                                  <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                      item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      {/* Right Live Item Inspector Panel */}
      {selectedItem && (
        <LiveItemInspector
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onItemUpdated={onRefreshData}
        />
      )}

      {/* Add New Dish Modal */}
      <AddDishModal
        isOpen={isAddDishOpen}
        onClose={() => setIsAddDishOpen(false)}
        categories={categories}
        restaurantId={restaurantId}
        onDishAdded={onRefreshData}
      />
    </div>
  );
}
