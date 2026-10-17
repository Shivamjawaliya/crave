'use client';

import React, { useState } from 'react';
import { Shield, Store, Users, DollarSign, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';

export default function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState([
    {
      id: 'res-1',
      name: 'Spicy Bites Kitchen',
      owner: 'Chef Marco (owner@spicybites.com)',
      address: '12 Brigade Road, Bengaluru',
      status: 'APPROVED',
      appliedAt: '2026-10-15',
    },
    {
      id: 'res-2',
      name: 'Bella Italia Woodfire',
      owner: 'Luigi V. (luigi@woodfire.com)',
      address: '88 Indiranagar, Bengaluru',
      status: 'PENDING',
      appliedAt: '2026-10-17',
    },
  ]);

  const setStatus = (id: string, status: string) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white">FoodPlatform Master Admin</h1>
            <p className="text-xs text-slate-400">System Oversight & Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Swagger Docs
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Registered Users</span>
              <p className="text-2xl font-black text-white">4,812</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Approved Kitchens</span>
              <p className="text-2xl font-black text-white">128</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
              <p className="text-2xl font-black text-white">
                {restaurants.filter((r) => r.status === 'PENDING').length}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Platform GMV</span>
              <p className="text-2xl font-black text-white">₹14,82,900</p>
            </div>
          </div>
        </div>

        {/* Restaurant Applications Management Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-base text-white">Restaurant Onboarding Review</h2>
            <span className="text-xs text-slate-400">Actions logged to audit history</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">Restaurant</th>
                  <th className="px-6 py-3">Owner Contact</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {restaurants.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold text-white">{res.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{res.owner}</td>
                    <td className="px-6 py-4 text-xs">{res.address}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          res.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : res.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {res.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setStatus(res.id, 'APPROVED')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setStatus(res.id, 'REJECTED')}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setStatus(res.id, 'SUSPENDED')}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
