'use client';

import React, { useState } from 'react';
import { X, Plus, Utensils, IndianRupee, Image as ImageIcon, Clock } from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
}

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  restaurantId: string;
  onDishAdded: () => void;
}

export default function AddDishModal({
  isOpen,
  onClose,
  categories,
  restaurantId,
  onDishAdded,
}: AddDishModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id || ''
  );
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a dish name');
      return;
    }
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please provide a valid price');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const gatewayUrl =
        (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');

      const res = await fetch(
        `${gatewayUrl}/restaurants/categories/${selectedCategoryId}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            pricePaise: Math.round(priceNum * 100),
            imageUrl: imageUrl.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to add new dish');
      }

      onDishAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating dish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-on-surface">Add New Culinary Dish</h3>
              <p className="text-[11px] text-on-surface-variant">Live additions propagate immediately to customer apps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface block">Dish / Drink Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alphonso Mango Chia Super Smoothie"
              className="w-full px-3 py-2 text-xs rounded-lg border border-surface-container-highest bg-white text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface block">Menu Category *</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-surface-container-highest bg-white text-on-surface focus:outline-none focus:border-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface block">Price (₹ INR) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  placeholder="249.00"
                  className="w-full pl-6 pr-3 py-2 text-xs rounded-lg border border-surface-container-highest bg-white text-on-surface focus:outline-none focus:border-primary font-mono"
                />
                <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">₹</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface block">Ingredients & Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fresh cold-pressed Alphonso mango pulp, soaked chia seeds, organic Greek yogurt."
              className="w-full px-3 py-2 text-xs rounded-lg border border-surface-container-highest bg-white text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface block">Image URL (Optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-surface-container-highest bg-white text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Publish to Menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
