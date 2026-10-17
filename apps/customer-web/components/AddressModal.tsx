'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Check,
  X,
  Trash2,
  Home,
  Briefcase,
  Navigation,
  Loader2,
  Star,
} from 'lucide-react';
import { useAddressStore, UserAddress } from '../lib/address.store';

export default function AddressModal() {
  const {
    addresses,
    selectedAddress,
    isModalOpen,
    closeModal,
    fetchAddresses,
    selectAddress,
    addAddress,
    setDefaultAddress,
    deleteAddress,
    isLoading,
  } = useAddressStore();

  const [userId, setUserId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Springfield');
  const [state, setState] = useState('OR');
  const [pincode, setPincode] = useState('97477');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserId(u.id);
        fetchAddresses(u.id);
      }
    } catch {
      // not logged in
    }
  }, [fetchAddresses]);

  if (!isModalOpen) return null;

  const handleSelect = (addr: UserAddress) => {
    selectAddress(addr);
    closeModal();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) {
      setErrorMsg('Please enter an address line');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const targetLabel = label === 'Other' && customLabel.trim() ? customLabel.trim() : label;
      if (userId) {
        const created = await addAddress(userId, {
          label: targetLabel,
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault,
        });
        selectAddress(created);
      } else {
        // Guest mode fallback
        const guestAddr: UserAddress = {
          id: `guest-${Date.now()}`,
          label: targetLabel,
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault: true,
        };
        selectAddress(guestAddr);
      }

      // Reset form
      setAddressLine('');
      setShowAddForm(false);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, addressId?: string) => {
    e.stopPropagation();
    if (!userId || !addressId) return;
    if (confirm('Delete this saved address?')) {
      await deleteAddress(userId, addressId);
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, addressId?: string) => {
    e.stopPropagation();
    if (!userId || !addressId) return;
    await setDefaultAddress(userId, addressId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Delivery Address</h3>
              <p className="text-xs text-slate-500">Select or add a destination for order & search</p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* List of saved addresses */}
          {!showAddForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Saved Addresses ({addresses.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ab2f00] hover:text-[#8f2700] bg-[#ffdbd1]/50 hover:bg-[#ffdbd1] px-3 py-1.5 rounded-full transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.map((addr) => {
                const isSelected =
                  (selectedAddress.id && addr.id === selectedAddress.id) ||
                  (!selectedAddress.id && addr.addressLine === selectedAddress.addressLine);

                return (
                  <div
                    key={addr.id || addr.addressLine}
                    onClick={() => handleSelect(addr)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#ab2f00] bg-[#fff5f2] shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[#ab2f00] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {addr.label?.toLowerCase() === 'work' ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <Home className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">
                              {addr.label || 'Home'}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-[#006c49]/10 text-[#006c49] px-2 py-0.5 rounded font-bold">
                                Default
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] bg-[#ab2f00] text-white px-2 py-0.5 rounded font-bold">
                                Selected
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-800 font-semibold truncate">
                            {addr.addressLine}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')} • Intercom available
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {userId && addr.id && !addr.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleSetDefault(e, addr.id)}
                            title="Set as Default"
                            className="text-[10px] text-slate-500 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                          >
                            Set Default
                          </button>
                        )}
                        {userId && addr.id && addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, addr.id)}
                            title="Delete Address"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Address Form */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Address Details
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {/* Label selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Address Label</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        label === l
                          ? 'border-[#ab2f00] bg-[#ab2f00] text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {l === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {l === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                      {l === 'Other' && <MapPin className="w-3.5 h-3.5" />}
                      <span>{l}</span>
                    </button>
                  ))}
                </div>
                {label === 'Other' && (
                  <input
                    type="text"
                    placeholder="e.g. Vacation Villa, Gym, Friend's Place"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                )}
              </div>

              {/* Address Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Street Address & Apartment / Suite *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">State / Region</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                </div>
              </div>

              {/* Pincode & Default Toggle */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Postal / Zip Code</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefaultCheck"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#ab2f00] rounded border-slate-300 focus:ring-[#ab2f00]"
                  />
                  <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Set as default address
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ab2f00]/25 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Select Address</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
