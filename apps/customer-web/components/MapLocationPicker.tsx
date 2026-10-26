'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  X,
  Loader2,
  Navigation,
  Compass,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
} from 'lucide-react';
import { resolveCoordinatesFromAddress } from '../lib/geo.utils';

export interface PickedLocation {
  latitude: number;
  longitude: number;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

interface MapLocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddressLine?: string;
  onConfirm: (location: PickedLocation) => void;
  onCancel?: () => void;
}

export default function MapLocationPicker({
  initialLat,
  initialLng,
  initialAddressLine,
  onConfirm,
  onCancel,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Fallback to Bhopal city center or resolved from initial address
  const fallback = resolveCoordinatesFromAddress(initialAddressLine || 'Bhopal', 'Bhopal');
  const defaultLat = initialLat && !isNaN(initialLat) ? initialLat : fallback.latitude;
  const defaultLng = initialLng && !isNaN(initialLng) ? initialLng : fallback.longitude;

  const [currentLat, setCurrentLat] = useState<number>(defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(defaultLng);
  const [addressLine, setAddressLine] = useState<string>(initialAddressLine || '');
  const [city, setCity] = useState<string>('Bhopal');
  const [state, setState] = useState<string>('Madhya Pradesh');
  const [pincode, setPincode] = useState<string>('462001');

  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // 1. Reverse Geocode Coordinates via MapTiler
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '9AJpC1Tfsixo02KS8Bpv';
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`);

      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const best = data.features[0];
          const context = best.context || [];

          const streetObj = context.find((c: any) => c.id?.startsWith('street'));
          const placeObj = context.find((c: any) => c.id?.startsWith('place') || c.id?.startsWith('neighbourhood'));
          const postObj = context.find((c: any) => c.id?.startsWith('postal_code'));
          const cityObj = context.find(
            (c: any) => c.id?.startsWith('municipality') || c.id?.startsWith('place')
          );
          const stateObj = context.find((c: any) => c.id?.startsWith('region'));

          const detectedArea =
            best.text ||
            streetObj?.text ||
            placeObj?.text ||
            best.place_name?.split(',')[0] ||
            'Selected Location';
          const detectedCity = cityObj?.text || 'Bhopal';
          const detectedState = stateObj?.text || 'Madhya Pradesh';
          const detectedPincode = postObj?.text ? postObj.text.replace(/\s+/g, '') : '462001';

          setAddressLine(detectedArea);
          setCity(detectedCity);
          setState(detectedState);
          setPincode(detectedPincode);
        } else {
          setAddressLine(`Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } else {
        setAddressLine(`Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
      setAddressLine(`Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if ((mapContainerRef.current as any)?._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 16,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      // Invalidate layout after animations
      setTimeout(() => {
        if (mapInstanceRef.current && isMounted) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);

      // Clean streets tile layer from MapTiler
      const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '9AJpC1Tfsixo02KS8Bpv';
      L.tileLayer(
        `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${maptilerKey}`,
        {
          attribution:
            '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          crossOrigin: true,
          maxZoom: 20,
          tileSize: 256,
        }
      ).addTo(map);

      // 📍 Interactive Draggable Delivery Pin
      const pinIcon = L.divIcon({
        className: 'custom-pin-drop-marker',
        html: `
          <div style="transform: translate(-50%, -100%); cursor: grab; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35));">
            <div style="background: #ab2f00; color: white; border-radius: 9999px; padding: 8px; border: 3px solid white; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; position: relative;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <div style="position: absolute; -bottom: 6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #ab2f00;"></div>
            </div>
            <div style="background: #0f172a; color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 8px; margin-top: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); text-align: center; white-space: nowrap; border: 1.5px solid white;">
              Drop Pin Here
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([defaultLat, defaultLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Handle Marker Drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentLat(pos.lat);
        setCurrentLng(pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });

      // Handle Map Click: Move marker to clicked point
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentLat(lat);
        setCurrentLng(lng);
        reverseGeocode(lat, lng);
      });

      // Initial reverse geocode if no address line passed
      if (!initialAddressLine) {
        reverseGeocode(defaultLat, defaultLng);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultLat, defaultLng, initialAddressLine, reverseGeocode]);

  // 3. Search for place or neighborhood
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '9AJpC1Tfsixo02KS8Bpv';
      const q = `${searchQuery.trim()}, Bhopal`.trim();
      const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${apiKey}`);

      let targetLat: number | null = null;
      let targetLng: number | null = null;

      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [fLng, fLat] = data.features[0].geometry.coordinates;
          targetLat = fLat;
          targetLng = fLng;
        }
      }

      if (!targetLat || !targetLng) {
        const local = resolveCoordinatesFromAddress(searchQuery, 'Bhopal');
        targetLat = local.latitude;
        targetLng = local.longitude;
      }

      if (targetLat && targetLng && mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([targetLat, targetLng], 16, { duration: 1.2 });
        markerRef.current.setLatLng([targetLat, targetLng]);
        setCurrentLat(targetLat);
        setCurrentLng(targetLng);
        reverseGeocode(targetLat, targetLng);
      }
    } catch (e) {
      console.warn('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Use My Current Device Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
          setCurrentLat(lat);
          setCurrentLng(lng);
          reverseGeocode(lat, lng);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: Number(currentLat.toFixed(6)),
      longitude: Number(currentLng.toFixed(6)),
      addressLine: addressLine || `Location (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})`,
      city: city || 'Bhopal',
      state: state || 'Madhya Pradesh',
      pincode: pincode || '462001',
    });
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg animate-in fade-in duration-200">
      {/* Top Search & Actions Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search colony, area or landmark (e.g. Indrapuri, MP Nagar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ab2f00] shadow-inner"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#ab2f00] hover:bg-[#8f2700] rounded-lg transition disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006c49] border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
          title="Center on my current GPS"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>Locate Me</span>
        </button>
      </div>

      {/* Map Canvas with Interactive Pin */}
      <div className="relative w-full h-[280px] sm:h-[340px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2.5 inset-x-3 z-10 flex justify-center pointer-events-none">
          <div className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg text-[11px] font-bold flex items-center gap-1.5 border border-slate-700 pointer-events-auto">
            <MapPin className="w-3.5 h-3.5 text-[#ffdbd1]" />
            <span>Click map or drag the pin to your exact building</span>
          </div>
        </div>

        {/* Map Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 shadow-md">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-sm"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-sm"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Location Bottom Bar */}
      <div className="p-3.5 bg-white border-t border-slate-200 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Target Destination
                </span>
                {isGeocoding && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-[#ab2f00]" />
                    Resolving street...
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 truncate mt-1">
                {addressLine || 'Pinned Location'}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {city}, {state} • {pincode}
              </p>
              <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">
                Coordinates: {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Confirmation Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className={`py-2.5 rounded-xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-black shadow-md shadow-[#ab2f00]/30 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              !onCancel ? 'col-span-2' : ''
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm Pin Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
