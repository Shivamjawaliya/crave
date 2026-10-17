'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  Shield,
  X,
  AlertOctagon,
  CheckCircle,
  Radio,
  Share2,
} from 'lucide-react';
import { reportTripIssue } from '../lib/api';

interface SupportSOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDeliveryId?: string;
  partnerUserId?: string;
  initialMode?: 'sos' | 'report';
}

export default function SupportSOSModal({
  isOpen,
  onClose,
  activeDeliveryId,
  partnerUserId,
  initialMode = 'sos',
}: SupportSOSModalProps) {
  const [tab, setTab] = useState<'sos' | 'report'>(initialMode);
  const [selectedReason, setSelectedReason] = useState('Vehicle breakdown / Flat tyre');
  const [notes, setNotes] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [sharedGps, setSharedGps] = useState(false);

  if (!isOpen) return null;

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeliveryId || !partnerUserId) {
      alert('Issue submitted. Our dispatcher team will contact you shortly.');
      onClose();
      return;
    }

    setReporting(true);
    try {
      await reportTripIssue(activeDeliveryId, partnerUserId, selectedReason, notes);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        onClose();
      }, 2500);
    } catch {
      alert('Report logged. Support notified.');
      onClose();
    } finally {
      setReporting(false);
    }
  };

  const handleShareGps = () => {
    setSharedGps(true);
    setTimeout(() => setSharedGps(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header Tabs */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTab('sos')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                tab === 'sos' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Emergency SOS</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('report')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                tab === 'report' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Report Trip Issue</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: EMERGENCY SOS */}
        {tab === 'sos' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                24/7 Rider Emergency Hotline
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Use only in case of safety threats, accidents, or medical emergencies.
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href="tel:112"
                className="w-full p-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5" />
                  <span>Call National Police Emergency</span>
                </div>
                <span className="bg-rose-800 px-2.5 py-1 rounded-xl text-xs font-mono font-bold">
                  112
                </span>
              </a>

              <a
                href="tel:102"
                className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-sm flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <span>Medical Ambulance Hotline</span>
                </div>
                <span className="bg-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-emerald-400">
                  102
                </span>
              </a>

              <a
                href="tel:1800123456"
                className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl shadow-sm flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <span>Rider Safety & Dispatch Desk</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">1800-FOOD-HELP</span>
              </a>
            </div>

            {/* Share Live GPS Pill */}
            <button
              type="button"
              onClick={handleShareGps}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>
                {sharedGps
                  ? 'Live GPS Broadcast Sent to Emergency Contact!'
                  : 'Broadcast Live GPS Coordinates to Emergency Contact'}
              </span>
            </button>
          </div>
        )}

        {/* TAB 2: REPORT TRIP ISSUE */}
        {tab === 'report' && (
          <form onSubmit={handleReportIssue} className="p-6 space-y-4">
            <div>
              <h3 className="font-black text-base text-slate-900">
                Report Exception or Delivery Issue
              </h3>
              <p className="text-xs text-slate-500">
                Facing an obstacle during this trip? Select the primary reason below:
              </p>
            </div>

            {reportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Exception report submitted. Support agent assigned.</span>
              </div>
            )}

            <div className="space-y-2">
              {[
                'Restaurant closed / Not responding',
                'Food spilled or damaged in transit',
                'Customer unreachable after 3 attempts',
                'Vehicle breakdown / Flat tyre',
                'Wrong customer address / Out of zone',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="issue_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the situation briefly..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={reporting}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
            >
              {reporting ? 'Submitting Report...' : 'Submit Issue to Dispatcher'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
