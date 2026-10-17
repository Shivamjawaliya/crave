'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bike, Shield, Radio, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import OfflineStandby from '../components/OfflineStandby';
import IncomingDispatchModal from '../components/IncomingDispatchModal';
import ActiveTripView from '../components/ActiveTripView';
import TripCelebrationModal from '../components/TripCelebrationModal';
import EarningsDashboard from '../components/EarningsDashboard';
import SupportSOSModal from '../components/SupportSOSModal';
import ProfileModal from '../components/ProfileModal';

import {
  DriverUser,
  DriverProfile,
  DriverStats,
  DeliveryTrip,
  fetchDriverProfile,
  toggleDutyStatus,
  fetchAvailableJobs,
  fetchActiveTrip,
  acceptDeliveryJob,
  updateDeliveryStatus,
  sendGpsCoordinates,
} from '../lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function DeliveryPartnerApp() {
  // Auth state
  const [user, setUser] = useState<DriverUser | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Duty & Navigation state
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'earnings'>('dispatch');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(88);
  const [gpsAccuracy, setGpsAccuracy] = useState('GPS Live • ±4m accuracy');

  // Trip state
  const [activeTrip, setActiveTrip] = useState<DeliveryTrip | null>(null);
  const [incomingJob, setIncomingJob] = useState<DeliveryTrip | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Modals state
  const [showSOS, setShowSOS] = useState(false);
  const [sosMode, setSosMode] = useState<'sos' | 'report'>('sos');
  const [showProfile, setShowProfile] = useState(false);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // 1. Initial Load: Auth check from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('delivery_user');
    const token = localStorage.getItem('delivery_token');

    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        loadProfileData(parsed.id);
      } catch {
        setShowAuthModal(true);
      }
    } else {
      setShowAuthModal(true);
    }

    // Battery API check
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Load driver profile & stats
  const loadProfileData = async (partnerUserId: string) => {
    try {
      const data = await fetchDriverProfile(partnerUserId);
      setUser(data.user);
      setProfile(data.profile);
      setStats(data.stats);
      setIsOnline(data.profile.isAvailable);
    } catch (e) {
      console.warn('Failed to fetch profile:', e);
    }
  };

  // 2. Socket.io Connection & Dispatch Pool
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('driver:subscribe', { partnerUserId: user.id });
    });

    // Listen for incoming dispatched orders
    socket.on('delivery:broadcast_job', () => {
      checkForDispatchJobs();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // 3. Check for active trip & available dispatch jobs
  const checkForDispatchJobs = async () => {
    if (!user || !isOnline) return;

    try {
      // Check if driver already has an active trip
      const current = await fetchActiveTrip(user.id);
      if (current) {
        setActiveTrip(current);
        setIncomingJob(null);
        return;
      }

      // If no active trip, check unassigned pool
      const available = await fetchAvailableJobs();
      if (available && available.length > 0) {
        // Pick top pending job
        setIncomingJob(available[0]);
      } else {
        setIncomingJob(null);
      }
    } catch (e) {
      console.warn('Error checking dispatch jobs:', e);
    }
  };

  // Periodic polling for available jobs when online & idle
  useEffect(() => {
    if (!user || !isOnline || activeTrip) return;

    checkForDispatchJobs();
    const interval = setInterval(checkForDispatchJobs, 6000);
    return () => clearInterval(interval);
  }, [user, isOnline, activeTrip]);

  // 4. Continuous GPS Location Streaming (Module 2)
  useEffect(() => {
    if (!user || !isOnline) return;

    // Stream coordinates every 8 seconds
    const interval = setInterval(() => {
      // Standard Bangalore / Bhopal coordinate jitter simulation for realistic map telemetry
      const baseLat = 23.2599; // Bhopal
      const baseLng = 77.4126;
      const jitterLat = (Math.random() - 0.5) * 0.002;
      const jitterLng = (Math.random() - 0.5) * 0.002;
      const currentCoords = {
        latitude: parseFloat((baseLat + jitterLat).toFixed(5)),
        longitude: parseFloat((baseLng + jitterLng).toFixed(5)),
      };

      setGpsAccuracy(`GPS Live • ±${Math.floor(Math.random() * 3 + 3)}m`);

      // 1. Emit to WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit('driver:location_update', {
          partnerUserId: user.id,
          orderId: activeTrip?.orderId,
          ...currentCoords,
        });
      }

      // 2. Persist to delivery microservice if on an active trip
      if (activeTrip?.id) {
        sendGpsCoordinates(activeTrip.id, currentCoords);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [user, isOnline, activeTrip]);

  // Duty Toggle
  const handleToggleOnline = async () => {
    if (!user) return;
    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      await toggleDutyStatus(user.id, nextState);
      if (!nextState) {
        setIncomingJob(null);
      } else {
        checkForDispatchJobs();
      }
    } catch {
      // Keep optimistic
    }
  };

  // Accept incoming 30s dispatch alert
  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    try {
      const accepted = await acceptDeliveryJob(jobId, user.id);
      setActiveTrip(accepted);
      setIncomingJob(null);
      if (user) loadProfileData(user.id);
    } catch (err: any) {
      alert(err.message || 'Failed to accept trip');
      setIncomingJob(null);
      checkForDispatchJobs();
    }
  };

  // Decline / Pass incoming job
  const handleDeclineJob = (jobId: string) => {
    setIncomingJob(null);
  };

  // Update trip status (ARRIVED_AT_STORE -> PICKED_UP -> ARRIVED_AT_CUSTOMER -> DELIVERED)
  const handleUpdateStatus = async (newStatus: string, extraData?: any) => {
    if (!activeTrip) return;
    setActiveTrip((prev) => (prev ? { ...prev, status: newStatus as any } : null));

    try {
      const updated = await updateDeliveryStatus(activeTrip.id, newStatus, extraData);
      setActiveTrip((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus as any,
          pickedUpAt: updated.pickedUpAt || prev.pickedUpAt,
          deliveredAt: updated.deliveredAt || prev.deliveredAt,
        };
      });
    } catch (e) {
      console.error('Failed to update status on server:', e);
    }
  };

  // Trip Completed celebration
  const handleTripCompleted = () => {
    setShowCelebration(true);
    setActiveTrip(null);
    if (user) loadProfileData(user.id);
  };

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    setUser(null);
    setProfile(null);
    setActiveTrip(null);
    setIncomingJob(null);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Module 1 & 2: Header with Identity, Duty Toggle & Telemetry */}
      <Header
        user={user}
        profile={profile}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        batteryLevel={batteryLevel}
        gpsAccuracy={gpsAccuracy}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSOS={() => {
          setSosMode('sos');
          setShowSOS(true);
        }}
        onOpenProfile={() => setShowProfile(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto">
        {/* If OFFLINE: show Offline Standby Screen */}
        {!isOnline ? (
          <OfflineStandby
            onGoOnline={handleToggleOnline}
            driverName={user?.name}
          />
        ) : activeTab === 'earnings' ? (
          /* Module 6: Earnings & Wallet Dashboard */
          <EarningsDashboard
            stats={stats}
            onRefresh={() => user && loadProfileData(user.id)}
          />
        ) : activeTrip ? (
          /* Module 4 & 5: Active Trip View (Store Handover & Customer Drop-off) */
          <ActiveTripView
            trip={activeTrip}
            onUpdateStatus={handleUpdateStatus}
            onReportIssue={() => {
              setSosMode('report');
              setShowSOS(true);
            }}
            onTripCompleted={handleTripCompleted}
          />
        ) : (
          /* Online & Idle Standby */
          <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
              <Radio className="w-8 h-8 animate-pulse text-emerald-500" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                Online & Available in Pool
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Searching for nearby orders...
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Stay on this screen. When a nearby restaurant prepares an order, an incoming dispatch alert with guaranteed payout will sound!
              </p>
            </div>

            <button
              type="button"
              onClick={checkForDispatchJobs}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 mx-auto transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Dispatch Pool</span>
            </button>
          </div>
        )}
      </main>

      {/* Module 1: Auth / Registration Modal */}
      <AuthModal
        isOpen={showAuthModal && !user}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setShowAuthModal(false);
          loadProfileData(loggedUser.id);
        }}
      />

      {/* Module 3: Incoming Order 30s Dispatch Screen with Alarm */}
      {incomingJob && (
        <IncomingDispatchModal
          job={incomingJob}
          onAccept={handleAcceptJob}
          onDecline={handleDeclineJob}
        />
      )}

      {/* Module 5: Trip Completion Celebration Modal */}
      <TripCelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        payout="₹65.00"
      />

      {/* Module 7: Emergency SOS & Report Issue Modal */}
      <SupportSOSModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
        activeDeliveryId={activeTrip?.id}
        partnerUserId={user?.id}
        initialMode={sosMode}
      />

      {/* Module 1: Profile & Vehicle Settings Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        profile={profile}
        onProfileUpdated={() => user && loadProfileData(user.id)}
      />
    </div>
  );
}
