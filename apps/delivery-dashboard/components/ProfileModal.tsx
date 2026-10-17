'use client';

import React, { useState } from 'react';
import {
  Bike,
  Zap,
  User,
  Phone,
  ShieldCheck,
  X,
  CheckCircle,
  Save,
} from 'lucide-react';
import { DriverUser, DriverProfile, updateDriverDetails } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DriverUser | null;
  profile: DriverProfile | null;
  onProfileUpdated: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  profile,
  onProfileUpdated,
}: ProfileModalProps) {
  const [vehicleType, setVehicleType] = useState(profile?.vehicleType || 'Motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState(profile?.vehicleNumber || 'KA-01-EA-4821');
  const [emergencyContact, setEmergencyContact] = useState(
    profile?.emergencyContact || '+91 91234 56789',
  );
  const [name, setName] = useState(user?.name || 'Alex Rider');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDriverDetails(user.id, {
        name,
        vehicleType,
        vehicleNumber,
        emergencyContact,
      });
      setSavedSuccess(true);
      onProfileUpdated();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              {vehicleType === 'EV' ? <Zap className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Partner Identity & Vehicle</h3>
              <p className="text-xs text-slate-400">Driver Profile Settings</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-bold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verification: Approved & Active</span>
          </span>
          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
            Verified Partner
          </span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Driver profile & vehicle successfully updated!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: 'Motorcycle', icon: Bike, label: 'Motorcycle' },
                { type: 'Scooter', icon: Bike, label: 'Scooter' },
                { type: 'Bicycle', icon: Bike, label: 'Bicycle' },
                { type: 'EV', icon: Zap, label: 'Electric EV' },
              ].map((v) => {
                const Icon = v.icon;
                const isSelected = vehicleType === v.type;
                return (
                  <button
                    key={v.type}
                    type="button"
                    onClick={() => setVehicleType(v.type)}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Plate No.</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
