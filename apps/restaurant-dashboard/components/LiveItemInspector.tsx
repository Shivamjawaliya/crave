'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Utensils, Tag, ShieldAlert, Layers, Save, RotateCcw } from 'lucide-react';

export interface InspectorItem {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface LiveItemInspectorProps {
  item: InspectorItem | null;
  onClose: () => void;
  onItemUpdated: () => void;
}

export default function LiveItemInspector({
  item,
  onClose,
  onItemUpdated,
}: LiveItemInspectorProps) {
  const [priceRupees, setPriceRupees] = useState('');
  const [prepTime, setPrepTime] = useState('12');
  const [station, setStation] = useState('Station #1 (Cold Press / Main Line)');
  const [allergens, setAllergens] = useState<string[]>(['Gluten-Free', 'No Dairy Added']);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (item) {
      setPriceRupees((item.pricePaise / 100).toFixed(2));
      setSaveSuccess(false);
    }
  }, [item]);

  if (!item) return null;

  const sku = `SKU-${item.id.slice(-4).toUpperCase()}`;

  const handleSave = async () => {
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setSaving(true);
    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      const res = await fetch(`${gatewayUrl}/restaurants/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePaise: Math.round(priceNum * 100),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        onItemUpdated();
      }
    } catch (e) {
      console.error('Failed to update item:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-80 lg:w-96 bg-white border-l border-surface-container flex flex-col h-full overflow-y-auto shadow-lg z-30">
      {/* Header */}
      <div className="p-4 border-b border-surface-container flex items-start justify-between bg-surface-container-low">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">
            LIVE ITEM INSPECTOR
          </span>
          <h3 className="font-semibold text-sm text-on-surface line-clamp-1">{item.name}</h3>
          <span className="font-mono text-[11px] text-primary font-medium">{sku}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {saveSuccess && (
        <div className="mx-4 mt-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Dish parameters synchronized live!</span>
        </div>
      )}

      {/* Body Controls */}
      <div className="p-4 space-y-5 flex-1">
        {/* Price & Prep Pace */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-container-low rounded-xl">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
              Base Price (₹)
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-on-surface">₹</span>
              <input
                type="number"
                step="0.01"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full bg-white px-2 py-1 text-sm font-mono font-semibold rounded border border-surface-container-highest text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
              Standard Prep
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-16 bg-white px-2 py-1 text-sm font-mono font-semibold rounded border border-surface-container-highest text-on-surface focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium">min</span>
              <Clock className="w-3.5 h-3.5 text-on-surface-variant ml-auto" />
            </div>
          </div>
        </div>

        {/* Tax Category & Routing */}
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase font-bold text-on-surface-variant block tracking-wider">
            Kitchen Station & Routing
          </span>
          <div className="p-3 bg-surface-container-low rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-on-surface font-medium flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-primary" />
                Line Station
              </span>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="bg-white px-2 py-1 text-[11px] rounded border border-surface-container-highest text-on-surface font-medium"
              >
                <option>Station #1 (Cold Press / Bar)</option>
                <option>Station #2 (Blender / Shakes)</option>
                <option>Station #3 (Bottling & Sealed Pass)</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-surface-container text-on-surface-variant">
              <span>Tax Category</span>
              <span className="font-mono font-semibold text-on-surface">5.00% GST</span>
            </div>
          </div>
        </div>

        {/* Active Allergens Declared */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-secondary" />
              Active Allergens Declared
            </span>
            <span className="text-[10px] text-primary font-bold cursor-pointer hover:underline">+ Edit</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allergens.map((alg) => (
              <span
                key={alg}
                className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-[11px] font-semibold border border-surface-container-high"
              >
                ● {alg}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-[11px] font-semibold border border-secondary/20">
              No Artificial Preservatives
            </span>
          </div>
        </div>

        {/* Modifier Groups */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Modifier Groups (3)
            </span>
            <span className="text-[10px] text-primary font-bold cursor-pointer hover:underline">+ Link Group</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Group 1 */}
            <div className="p-2.5 bg-surface-container-low rounded-xl space-y-1.5">
              <div className="flex justify-between font-semibold text-[11px]">
                <span className="text-on-surface">Sweetness Preference</span>
                <span className="text-on-surface-variant font-mono">1 REQ.</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[11px] font-medium">
                  Zero Added Sugar
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-on-surface-variant text-[11px] border border-surface-container">
                  Raw Organic Honey (+₹20)
                </span>
              </div>
            </div>

            {/* Group 2 */}
            <div className="p-2.5 bg-surface-container-low rounded-xl space-y-1.5">
              <div className="flex justify-between font-semibold text-[11px]">
                <span className="text-on-surface">Temperature / Ice</span>
                <span className="text-on-surface-variant font-mono">1 REQ.</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[11px] font-medium">
                  Chilled (Standard)
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-on-surface-variant text-[11px] border border-surface-container">
                  Room Temperature
                </span>
              </div>
            </div>

            {/* Group 3 */}
            <div className="p-2.5 bg-surface-container-low rounded-xl space-y-1.5">
              <div className="flex justify-between font-semibold text-[11px]">
                <span className="text-on-surface">Superfood Boosters</span>
                <span className="text-on-surface-variant font-mono">OPTIONAL</span>
              </div>
              <div className="space-y-1 text-[11px] text-on-surface-variant">
                <div className="flex justify-between">
                  <span>+ Organic Chia Seeds</span>
                  <span className="font-mono font-semibold">+₹30.00</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Plant Protein Scoop (15g)</span>
                  <span className="font-mono font-semibold">+₹60.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-surface-container bg-surface-container-low flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Syncing...' : 'Save Item Changes'}</span>
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 bg-white hover:bg-surface-container border border-surface-container text-on-surface-variant text-xs font-semibold rounded-lg transition"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
