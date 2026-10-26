'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  Crosshair,
  Phone,
  User,
  CheckCircle2,
  Map as MapIcon,
  Compass,
} from 'lucide-react';
import { useAddressStore, UserAddress } from '../lib/address.store';
import { resolveCoordinatesFromAddress } from '../lib/geo.utils';
import type { PickedLocation } from './MapLocationPicker';

const MapLocationPicker = dynamic(() => import('./MapLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 border border-slate-200">
      <Loader2 className="w-6 h-6 animate-spin text-[#ab2f00]" />
      <span className="text-xs font-bold">Loading interactive map...</span>
    </div>
  ),
});

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
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // GPS & Map Pin location state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [detectedSummary, setDetectedSummary] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Form state (Zomato-style: House No, Landmark, Area, Contact details)
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressLine, setAddressLine] = useState(''); // Area / Street
  const [city, setCity] = useState('Bhopal');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('462001');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserId(u.id);
        fetchAddresses(u.id);
        if (u.name && !contactName) setContactName(u.name);
        if (u.phone && !contactPhone) setContactPhone(u.phone);
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

  // 🗺️ Callback when user confirms a location on the interactive map
  const handleMapLocationConfirmed = (picked: PickedLocation) => {
    setLatitude(picked.latitude);
    setLongitude(picked.longitude);
    setAddressLine(picked.addressLine);
    setCity(picked.city);
    setState(picked.state);
    setPincode(picked.pincode);
    setGpsSuccess(true);
    setDetectedSummary(`${picked.addressLine}, ${picked.city} (${picked.latitude}, ${picked.longitude})`);
    setShowMapPicker(false);
    setShowAddForm(true);
  };

  // 📍 Use My Current Location (Zomato style with MapTiler reverse geocoding)
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg('');
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '9AJpC1Tfsixo02KS8Bpv';
          const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`);

          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              const best = data.features[0];
              const context = best.context || [];

              const postObj = context.find((c: any) => c.id?.startsWith('postal_code'));
              const cityObj = context.find((c: any) => c.id?.startsWith('municipality') || c.id?.startsWith('place'));
              const stateObj = context.find((c: any) => c.id?.startsWith('region'));

              const detectedArea = best.text || best.place_name?.split(',')[0] || 'Current Area';
              const detectedCity = cityObj?.text || 'Bhopal';
              const detectedState = stateObj?.text || 'Madhya Pradesh';
              const detectedPincode = postObj?.text ? postObj.text.replace(/\s+/g, '') : '462001';

              setAddressLine(detectedArea);
              setCity(detectedCity);
              setState(detectedState);
              setPincode(detectedPincode);
              setDetectedSummary(`${detectedArea}, ${detectedCity} • ${detectedPincode}`);
              setGpsSuccess(true);
            } else {
              setAddressLine(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
              setGpsSuccess(true);
            }
          } else {
            setAddressLine(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setGpsSuccess(true);
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
          setAddressLine(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setGpsSuccess(true);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setErrorMsg(`Unable to get location: ${err.message}. Please enter details manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!houseNumber.trim() && !addressLine.trim()) {
      setErrorMsg('Please enter your House/Flat number or address line');
      return;
    }

    if (!contactName.trim()) {
      setErrorMsg("Please enter the receiver's name for delivery");
      return;
    }

    if (!contactPhone.trim()) {
      setErrorMsg('Please enter a contact phone number for the delivery partner');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const targetLabel = label === 'Other' && customLabel.trim() ? customLabel.trim() : label;

      // Compose full human-readable address line
      const fullAddressParts = [
        houseNumber.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : null,
        addressLine.trim(),
      ].filter(Boolean);
      const fullAddress = fullAddressParts.join(', ');

      let resolvedLat = latitude;
      let resolvedLng = longitude;

      // If user typed address without GPS, forward-geocode using MapTiler API
      if (resolvedLat == null || resolvedLng == null) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '9AJpC1Tfsixo02KS8Bpv';
          const query = `${addressLine.trim()}, ${city.trim()}`.trim();
          const geoRes = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.features && geoData.features.length > 0) {
              const [fLng, fLat] = geoData.features[0].geometry.coordinates;
              resolvedLat = fLat;
              resolvedLng = fLng;
            }
          }
        } catch (e) {
          console.warn('MapTiler forward geocode failed, falling back:', e);
        }
      }

      // If still missing, resolve from known Bhopal neighborhood landmarks or deterministic offset
      if (resolvedLat == null || resolvedLng == null) {
        const fallbackCoords = resolveCoordinatesFromAddress(fullAddress, city.trim());
        resolvedLat = fallbackCoords.latitude;
        resolvedLng = fallbackCoords.longitude;
      }

      const payload = {
        label: targetLabel,
        houseNumber: houseNumber.trim() || undefined,
        landmark: landmark.trim() || undefined,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        addressLine: fullAddress,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        latitude: resolvedLat ?? undefined,
        longitude: resolvedLng ?? undefined,
        isDefault,
      };

      if (userId) {
        const created = await addAddress(userId, payload);
        selectAddress(created);
      } else {
        // Guest mode fallback
        const guestAddr: UserAddress = {
          id: `guest-${Date.now()}`,
          ...payload,
          isDefault: true,
        };
        selectAddress(guestAddr);
      }

      // Reset form
      setHouseNumber('');
      setLandmark('');
      setAddressLine('');
      setLatitude(null);
      setLongitude(null);
      setGpsSuccess(false);
      setDetectedSummary('');
      setShowMapPicker(false);
      setShowAddForm(false);
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save address to database');
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] max-w-lg w-full p-4 sm:p-7 shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] sm:max-h-[92vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Delivery Address</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Select or add a destination for order & search</p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto py-3.5 space-y-4 flex-1 pr-1">
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(null);
                      setLongitude(null);
                      setGpsSuccess(false);
                      setDetectedSummary('');
                      setShowMapPicker(true);
                      setShowAddForm(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 px-3 py-1.5 rounded-full transition shadow-sm cursor-pointer"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Select on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(null);
                      setLongitude(null);
                      setGpsSuccess(false);
                      setDetectedSummary('');
                      setShowMapPicker(false);
                      setShowAddForm(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ab2f00] hover:text-[#8f2700] bg-[#ffdbd1]/60 hover:bg-[#ffdbd1] px-3.5 py-1.5 rounded-full transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>
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
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[#ab2f00] text-white shadow-sm'
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {addr.latitude && addr.longitude && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                📍 GPS Pinned
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-800 font-bold truncate">
                            {addr.addressLine}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                          </p>

                          {(addr.contactName || addr.contactPhone) && (
                            <p className="text-[10px] font-semibold text-slate-600 bg-slate-100/70 inline-block px-2 py-0.5 rounded-md mt-1">
                              Receiver: {addr.contactName || 'Customer'} • 📞 {addr.contactPhone || 'N/A'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {userId && addr.id && !addr.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleSetDefault(e, addr.id)}
                            title="Set as Default"
                            className="text-[10px] text-slate-500 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition"
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

          {/* Add Address Form (Zomato Style) */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add Delivery Address
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* 📍 Location Input Options: Interactive Map Drop-Pin or Device GPS */}
              {showMapPicker ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center">
                        <MapIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Drop Point on Map</h4>
                        <p className="text-[10px] text-slate-500">
                          Click anywhere on the map or drag the pin to set your exact doorstep
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Hide Map
                    </button>
                  </div>

                  <MapLocationPicker
                    initialLat={latitude}
                    initialLng={longitude}
                    initialAddressLine={addressLine}
                    onConfirm={handleMapLocationConfirmed}
                    onCancel={() => setShowMapPicker(false)}
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 🗺️ Option A: Select from Map / Drop Pin */}
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-200/90 hover:border-[#ab2f00] text-left transition flex items-center justify-between group shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                          <MapIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                            <span>Select on Map</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            Drop a pin at your exact doorstep
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#ab2f00] bg-white px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 shadow-2xs group-hover:bg-[#ab2f00] group-hover:text-white transition-colors">
                        Drop Pin
                      </span>
                    </button>

                    {/* 📍 Option B: Use Current Device GPS */}
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50 border-2 border-emerald-200/90 hover:border-emerald-600 text-left transition flex items-center justify-between group shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
                          {isLocating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Crosshair className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-emerald-950 truncate flex items-center gap-1">
                            <span>Use Device GPS</span>
                          </h4>
                          <p className="text-[10px] text-emerald-700 line-clamp-1">
                            Autofill live sensor location
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {isLocating ? 'Locating...' : 'Auto-detect'}
                      </span>
                    </button>
                  </div>

                  {/* Confirmed Pin / GPS Status Badge */}
                  {(latitude != null || gpsSuccess) && (
                    <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">
                            ✓ Coordinates Pinned on Map
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {addressLine || 'Pinned Location'}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            Lat: {latitude?.toFixed(6)}, Lng: {longitude?.toFixed(6)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="text-xs font-black text-[#ab2f00] hover:underline px-2.5 py-1 rounded-lg bg-white border border-amber-200 shrink-0 cursor-pointer shadow-2xs"
                      >
                        Adjust Pin
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 🏠 2. Doorstep Specifics: House No & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                    <span>House / Flat / Floor No.</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Royal Palms / 3rd Floor"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00] bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-800">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near City Hospital / Opp. Park"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00] bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 🌆 3. Area & City (Auto-fetched or editable) */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Street / Area / Locality</span>
                  {gpsSuccess && <span className="text-[10px] text-emerald-600 font-bold">✓ Autofilled via GPS</span>}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MP Nagar Zone 2 / Indiranagar"
                  value={addressLine}
                  onChange={(e) => {
                    setAddressLine(e.target.value);
                    if (gpsSuccess) {
                      setGpsSuccess(false);
                      setLatitude(null);
                      setLongitude(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00] bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                </div>
              </div>

              {/* 👤 4. Contact Details for Delivery Partner (Zomato Style) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Delivery Contact Person
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Receiver Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shivam Jawaliya"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Contact Phone *</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      placeholder="e.g. 98260 12345"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 🏷️ 5. Label Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Save Address As</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    placeholder="e.g. Gym, Friend's Place, Villa"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#ab2f00]"
                  />
                )}
              </div>

              {/* Default checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-[#ab2f00] rounded border-slate-300 focus:ring-[#ab2f00]"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ab2f00]/25 transition disabled:opacity-50 cursor-pointer"
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
