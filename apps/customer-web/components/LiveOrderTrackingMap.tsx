'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navigation, Bike, Store, Home, Radio, Compass, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { resolveCoordinatesFromAddress } from '../lib/geo.utils';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface DriverTelemetry {
  orderId: string;
  prev: LocationPoint;
  curr: LocationPoint;
  bearing: number;
  speed: number;
  updatedAt: string;
}

interface LiveOrderTrackingMapProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  restaurant: {
    name: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  customerAddress: {
    addressLine: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  onStatusUpdate?: (status: string) => void;
}

export default function LiveOrderTrackingMap({
  orderId,
  orderNumber,
  orderStatus,
  restaurant,
  customerAddress,
  onStatusUpdate,
}: LiveOrderTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Telemetry UI state
  const [telemetry, setTelemetry] = useState<DriverTelemetry | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(14);
  const [speedKmh, setSpeedKmh] = useState<number>(26);
  const [bearingDeg, setBearingDeg] = useState<number>(45);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Intelligent resolution: use provided coordinates or deduce from address line
  const resolvedCustCoords = useMemo(() => {
    if (customerAddress.latitude != null && customerAddress.longitude != null && !isNaN(Number(customerAddress.latitude))) {
      return {
        latitude: Number(customerAddress.latitude),
        longitude: Number(customerAddress.longitude),
      };
    }
    return resolveCoordinatesFromAddress(customerAddress.addressLine);
  }, [customerAddress.latitude, customerAddress.longitude, customerAddress.addressLine]);

  const restLat = Number(restaurant.latitude) || 23.2324;
  const restLng = Number(restaurant.longitude) || 77.4300;
  const custLat = resolvedCustCoords.latitude;
  const custLng = resolvedCustCoords.longitude;

  // 1. Fetch Driving Route from OSRM
  const fetchDrivingRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const durationMin = Math.max(3, Math.round(route.duration / 60));
          setEtaMinutes(durationMin);
          return coords;
        }
      }
    } catch {
      // Fallback to straight line
    }
    return [start, end];
  }, []);

  // 2. Smooth Linear Interpolation (LERP) 60 FPS animation
  const animateDriverMarker = useCallback((prev: LocationPoint, curr: LocationPoint, bearing: number) => {
    if (!driverMarkerRef.current) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const durationMs = 3000; // Expected ping interval
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth Ease-in-out easing
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const lat = prev.latitude + (curr.latitude - prev.latitude) * ease;
      const lng = prev.longitude + (curr.longitude - prev.longitude) * ease;

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([lat, lng]);

        // Rotate bike icon
        const iconEl = driverMarkerRef.current.getElement();
        if (iconEl) {
          const bikeSvg = iconEl.querySelector('.driver-bike-icon');
          if (bikeSvg) {
            bikeSvg.style.transform = `rotate(${bearing}deg)`;
          }
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      }
    };

    animFrameRef.current = requestAnimationFrame(frame);
  }, []);

  // 3. Initialize Leaflet Map (Client-Side Only)
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

      // Initialize Map
      const map = L.map(mapContainerRef.current, {
        center: [restLat, restLng],
        zoom: 14,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      // Invalidate size once DOM layout settles
      setTimeout(() => {
        if (mapInstanceRef.current && isMounted) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      // MapTiler Streets v4 (High-fidelity clean streets style)
      const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '9AJpC1Tfsixo02KS8Bpv';
      L.tileLayer(
        `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${maptilerKey}`,
        {
          attribution:
            '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          crossOrigin: true,
          maxZoom: 20,
          tileSize: 256,
        },
      ).addTo(map);

      // 🏪 1. Restaurant Marker
      const restIcon = L.divIcon({
        className: 'custom-rest-marker',
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background: #ea580c; color: white; border-radius: 9999px; padding: 7px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4); border: 2.5px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
            </div>
            <div style="background: white; color: #1e293b; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; margin-top: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); text-align: center; white-space: nowrap; border: 1px solid #e2e8f0;">
              ${restaurant.name}
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });
      L.marker([restLat, restLng], { icon: restIcon }).addTo(map);

      // 🏠 2. Customer Destination Marker
      const custIcon = L.divIcon({
        className: 'custom-cust-marker',
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background: #059669; color: white; border-radius: 9999px; padding: 7px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); border: 2.5px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style="background: white; color: #065f46; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; margin-top: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); text-align: center; white-space: nowrap; border: 1px solid #e2e8f0;">
              Your Location
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });
      L.marker([custLat, custLng], { icon: custIcon }).addTo(map);

      // 🛵 3. Real-time Animated Driver Marker
      const initialDriverLat = restLat + (custLat - restLat) * 0.15;
      const initialDriverLng = restLng + (custLng - restLng) * 0.15;

      const driverIcon = L.divIcon({
        className: 'custom-driver-marker',
        html: `
          <div style="transform: translate(-50%, -50%); position: relative;">
            <div class="driver-pulse" style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(16, 185, 129, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div class="driver-bike-icon" style="background: #0f172a; color: #34d399; border-radius: 9999px; padding: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 2.5px solid white; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; transition: transform 0.5s ease-out; transform: rotate(45deg);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
            <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #34d399; font-size: 9px; font-weight: 800; padding: 1.5px 5px; border-radius: 4px; white-space: nowrap; letter-spacing: 0.05em; border: 1px solid #334155;">
              RIDER
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const driverMarker = L.marker([initialDriverLat, initialDriverLng], { icon: driverIcon }).addTo(map);
      driverMarkerRef.current = driverMarker;

      // 4. Fetch & Draw Road Route
      const routeCoords = await fetchDrivingRoute([restLat, restLng], [custLat, custLng]);
      if (isMounted) {
        const polyline = L.polyline(routeCoords, {
          color: '#0284c7',
          weight: 4.5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(map);
        routePolylineRef.current = polyline;

        // Auto-fit bounds to show restaurant, driver, and customer
        map.fitBounds([
          [restLat, restLng],
          [custLat, custLng],
        ], { padding: [50, 50] });

        setIsMapLoaded(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [restLat, restLng, custLat, custLng, restaurant.name, fetchDrivingRoute]);

  // 4. Connect to Real-time WebSocket Gateway for Telemetry
  useEffect(() => {
    const gatewayUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket: Socket = io(gatewayUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsSocketConnected(true);
      // Join scoped room for this order
      socket.emit('order:subscribe', { orderId });
      socket.emit('join_order', { orderId });
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // 📡 Live Telemetry Broadcast Listener
    socket.on('driver:location_updated', (data: DriverTelemetry) => {
      console.log(
        '%c📍 [CUSTOMER APP RECEIVED DRIVER COORDINATES]',
        'color: #10b981; font-weight: bold; font-size: 12px; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;',
        {
          orderId: data.orderId,
          coordinates: {
            latitude: data.curr?.latitude,
            longitude: data.curr?.longitude,
          },
          previousCoordinates: {
            latitude: data.prev?.latitude,
            longitude: data.prev?.longitude,
          },
          bearing: `${data.bearing}°`,
          speed: `${data.speed} km/h`,
          receivedAt: new Date().toLocaleTimeString(),
        }
      );

      if (data.orderId === orderId || !data.orderId) {
        setTelemetry(data);
        if (data.speed) setSpeedKmh(Math.round(data.speed));
        if (data.bearing !== undefined) setBearingDeg(Math.round(data.bearing));

        // Trigger 60 FPS interpolation animation
        if (data.prev && data.curr) {
          animateDriverMarker(data.prev, data.curr, data.bearing || 0);
        }
      }
    });

    // Also support fallback raw location events
    socket.on('delivery:location', (coords: { latitude: number; longitude: number }) => {
      console.log('📍 [CUSTOMER APP RECEIVED DELIVERY LOCATION]:', coords);
    });

    // 🛑 Terminate tracking & sever socket when order is delivered
    socket.on('order:tracking_ended', () => {
      console.log('🔌 [CUSTOMER APP] Order delivered! Server ended tracking session. Severing Redis telemetry socket.');
      onStatusUpdate?.('DELIVERED');
      socket.emit('order:unsubscribe', { orderId });
      socket.disconnect();
    });

    socket.on('order_status_updated', (data: any) => {
      const nextStatus = data?.newStatus || data?.status;
      if (nextStatus) {
        onStatusUpdate?.(nextStatus);
      }
      if (nextStatus === 'DELIVERED') {
        console.log('🏁 [CUSTOMER APP] Order marked DELIVERED. Disconnecting tracking socket.');
        socket.emit('order:unsubscribe', { orderId });
        socket.disconnect();
      }
    });

    // Also poll cached telemetry once on initial mount for instant zero-wait position
    const fetchInitialTelemetry = async () => {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
        const res = await fetch(`${apiBase}/delivery/orders/${orderId}/telemetry`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.curr) {
            console.log(
              '%c📍 [CUSTOMER APP INITIAL DRIVER COORDINATES LOADED]',
              'color: #0284c7; font-weight: bold; font-size: 12px; background: #f0f9ff; padding: 2px 6px; border-radius: 4px;',
              {
                orderId,
                coordinates: {
                  latitude: data.curr.latitude,
                  longitude: data.curr.longitude,
                },
                bearing: `${data.bearing}°`,
                speed: `${data.speed} km/h`,
              }
            );
            setTelemetry(data);
            if (data.speed) setSpeedKmh(Math.round(data.speed));
            if (data.bearing) setBearingDeg(Math.round(data.bearing));
            if (driverMarkerRef.current) {
              driverMarkerRef.current.setLatLng([data.curr.latitude, data.curr.longitude]);
            }
          }
        }
      } catch {}
    };

    fetchInitialTelemetry();

    return () => {
      socket.emit('order:unsubscribe', { orderId });
      socket.disconnect();
    };
  }, [orderId, animateDriverMarker]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds([
        [restLat, restLng],
        [custLat, custLng],
      ], { padding: [50, 50] });
      mapInstanceRef.current.invalidateSize();
    }
  };

  const getBannerInfo = () => {
    switch (orderStatus) {
      case 'PLACED':
      case 'ACCEPTED':
      case 'PREPARING':
        return {
          title: 'Order Confirmed • Kitchen Preparing Meal',
          subtitle: 'Dispatch route assigned • Telemetry active between restaurant and your location',
          badge: 'Kitchen Preparing',
        };
      case 'READY_FOR_PICKUP':
        return {
          title: 'Meal Packaged • Rider Arriving at Kitchen',
          subtitle: 'Rider is pulling up to the restaurant pickup counter',
          badge: 'Arriving at Pickup',
        };
      case 'DELIVERED':
        return {
          title: 'Meal Safely Delivered 🎉',
          subtitle: 'Handover complete and verified via OTP',
          badge: 'Delivered',
        };
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
      default:
        return {
          title: 'Driver En Route with Your Meal 🛵',
          subtitle: 'Real-time telemetry updated via Redis • 60 FPS motion interpolation',
          badge: 'En Route',
        };
    }
  };

  const banner = getBannerInfo();

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
      {/* 1. Header Overlay: Telemetry Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-md pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              {isSocketConnected ? 'GPS Live Tracking' : 'Connecting GPS...'}
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-bold text-emerald-700">
            {etaMinutes} mins ETA
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono font-bold shadow-md flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{speedKmh} km/h</span>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-md transition cursor-pointer"
            title="Reset Map View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[280px] sm:h-[380px] z-0"
        style={{ minHeight: '260px' }}
      />

      {/* 3. Bottom Card: Driver & Route Summary */}
      <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <Bike className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-900 block">
              {banner.title}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {banner.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Bearing: {bearingDeg}°
          </span>
          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {banner.badge}
          </span>
        </div>
      </div>
    </div>
  );
}
