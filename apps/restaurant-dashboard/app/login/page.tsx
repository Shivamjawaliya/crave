'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  Store,
} from 'lucide-react';
import { setOwnerSession } from '../../lib/auth';

export default function RestaurantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${gatewayUrl}/auth/restaurant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Verify RBAC role
      if (data.user.role !== 'RESTAURANT_OWNER' && data.user.role !== 'ADMIN') {
        throw new Error(
          'Access restricted: This account does not have RESTAURANT_OWNER privileges.',
        );
      }

      setOwnerSession(data.user, data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('owner@spicybites.com');
    setPassword('Password@123');
    setError(null);
    setLoading(true);

    try {
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${gatewayUrl}/auth/restaurant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@spicybites.com',
          password: 'Password@123',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Demo login failed');
      }

      setOwnerSession(data.user, data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161c23] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#ffdbd1] selection:text-[#3a0a00] relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#ab2f00]/20 to-transparent blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] text-white shadow-xl shadow-[#ab2f00]/30 mb-4 animate-in zoom-in-90">
          <ChefHat className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="font-serif font-black text-2xl tracking-tight text-white">
            Crave
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#ffdbd1] bg-[#ab2f00]/40 px-2.5 py-0.5 rounded-full border border-[#ab2f00]/50">
            Merchant Portal
          </span>
        </div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight">
          Executive Kitchen Display
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Manage incoming tickets, track cooking lifecycle, and signal couriers.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-[#1e2530] border border-slate-700/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl space-y-6">
          {/* RBAC Notice */}
          <div className="p-3 rounded-2xl bg-[#ab2f00]/10 border border-[#ab2f00]/30 flex items-start gap-2.5 text-xs text-[#ffdbd1]">
            <ShieldCheck className="w-4 h-4 text-[#ab2f00] shrink-0 mt-0.5" />
            <span>
              <strong>RBAC Protected:</strong> Exclusive access for <strong>RESTAURANT_OWNER</strong> role. Customer accounts are restricted.
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Owner Business Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="chef@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#161c23] border border-slate-700 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:border-[#ab2f00] focus:outline-none transition placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#161c23] border border-slate-700 text-white text-xs rounded-xl pl-10 pr-10 py-2.5 focus:border-[#ab2f00] focus:outline-none transition placeholder:text-slate-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ab2f00]/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying RBAC Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Kitchen Display</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="pt-2 border-t border-slate-700/60">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
            >
              <Store className="w-3.5 h-3.5 text-[#ffdbd1]" />
              <span>Demo Login: Chef Marco (Spicy Bites)</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center text-xs text-slate-400 pt-2">
            <span>New culinary partner? </span>
            <Link
              href="/register"
              className="font-bold text-[#ffdbd1] hover:underline"
            >
              Register your restaurant
            </Link>
          </div>
        </div>

        {/* Portal Switcher */}
        <div className="text-center mt-6">
          <a
            href="http://localhost:3000"
            className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
          >
            ← Switch to Customer Web App (Port 3000)
          </a>
        </div>
      </div>
    </div>
  );
}
