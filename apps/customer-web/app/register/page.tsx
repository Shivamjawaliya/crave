'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  ShoppingBag,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Check,
  UtensilsCrossed,
  ChevronDown,
  Gift,
  Truck,
  Sparkles,
  Clock,
  Smartphone,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [optInGuild, setOptInGuild] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service to continue.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const rawGateway = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
      const primaryUrl = rawGateway.endsWith('/auth/register') ? rawGateway : `${rawGateway}/auth/register`;

      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'CUSTOMER',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
        document.cookie = `access_token=${data.accessToken}; path=/; max-age=86400; SameSite=Lax`;
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to register. Please check your details.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] antialiased min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9ff]/90 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.06)]">
        <div className="h-20 w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between gap-4">
          {/* Left Brand & Delivery Switcher */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#ab2f00] flex items-center justify-center text-white font-black text-lg shadow-sm">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-[#161c23] hidden sm:inline">
                Crave
              </span>
            </Link>

            <div className="hidden xl:flex items-center bg-[#eef4fe] rounded-full px-4 py-1.5 border border-[#e4beb4]/30 shadow-sm cursor-pointer hover:bg-[#e9eef8] transition-colors">
              <MapPin className="text-[#ab2f00] w-4 h-4 mr-1.5 shrink-0" />
              <div className="flex flex-col text-left mr-2">
                <span className="text-[11px] text-[#5b4139] leading-none font-medium">
                  Deliver to
                </span>
                <span className="text-sm font-semibold text-[#161c23] truncate max-w-[170px] leading-tight">
                  742 Evergreen Terr, 4B
                </span>
              </div>
              <ChevronDown className="text-[#5b4139] w-4 h-4" />
            </div>

            <div className="hidden lg:flex items-center bg-[#e9eef8] p-1 rounded-full border border-[#e4beb4]/20">
              <button
                type="button"
                onClick={() => setDeliveryMode('delivery')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                  deliveryMode === 'delivery'
                    ? 'bg-white text-[#ab2f00]'
                    : 'text-[#5b4139] hover:text-[#161c23]'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('pickup')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  deliveryMode === 'pickup'
                    ? 'bg-white text-[#ab2f00] shadow-sm'
                    : 'text-[#5b4139] hover:text-[#161c23]'
                }`}
              >
                Pickup
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-[#5b4139] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or dishes..."
                className="w-full h-11 pl-10 pr-12 rounded-xl bg-white border border-[#e4beb4]/40 text-[#161c23] placeholder-[#5b4139]/70 text-sm focus:outline-none focus:border-[#ab2f00] focus:ring-2 focus:ring-[#ab2f00]/20 transition-all shadow-sm"
              />
              <div className="absolute right-3 flex items-center justify-center px-1.5 py-0.5 rounded bg-[#e3e8f2] border border-[#e4beb4]/30 text-[10px] text-[#5b4139] font-bold">
                ⌘K
              </div>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/offers"
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[#5b4139] hover:text-[#161c23] transition-colors"
              >
                Offers
              </Link>
              <Link
                href="/orders"
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[#5b4139] hover:text-[#161c23] transition-colors"
              >
                Past Orders
              </Link>
            </nav>

            <Link
              href="/cart"
              className="flex items-center gap-2 h-11 px-4 rounded-full bg-[#ab2f00] hover:bg-[#d53e02] text-white text-sm font-bold shadow-[0_4px_14px_-2px_rgba(171,47,0,0.35)] transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart (0) • $0.00</span>
              <span className="sm:hidden">0</span>
            </Link>

            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-xs font-bold text-[#ab2f00] border border-[#ab2f00]/30 hover:bg-[#ffdbd1]/30 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Flow */}
      <main className="w-full pt-20 bg-[#f7f9ff] flex-1">
        <div className="flex flex-col w-full relative overflow-hidden py-10 sm:py-14">
          {/* Ambient Background Canvas */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute -top-32 -left-24 w-[540px] h-[540px] rounded-full bg-[#ffdbd1]/35 blur-3xl mix-blend-multiply opacity-70" />
            <div className="absolute top-1/3 -right-28 w-[600px] h-[600px] rounded-full bg-[#6ffbbe]/25 blur-3xl mix-blend-multiply opacity-50" />
            <div className="absolute -bottom-36 left-1/3 w-[500px] h-[500px] rounded-full bg-[#ffdbd0]/30 blur-3xl mix-blend-multiply opacity-60" />

            {/* Editorial Background Images */}
            <div className="hidden xl:grid grid-cols-2 gap-8 absolute inset-0 opacity-15 max-w-[1400px] mx-auto px-12 items-center justify-between">
              <div className="space-y-8 transform -rotate-1 translate-y-6">
                <div className="w-72 h-88 rounded-3xl overflow-hidden shadow-2xl bg-[#e3e8f2]">
                  <img
                    alt="Artisanal pasta"
                    className="w-full h-full object-cover contrast-105"
                    src="https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=500&auto=format&fit=crop"
                  />
                </div>
                <div className="w-56 h-64 ml-16 rounded-3xl overflow-hidden shadow-xl bg-[#e3e8f2]">
                  <img
                    alt="Wood-fired pizza"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end space-y-8 transform rotate-1 -translate-y-4">
                <div className="w-64 h-80 rounded-3xl overflow-hidden shadow-2xl bg-[#e3e8f2] mr-6">
                  <img
                    alt="Omakase sushi"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop"
                  />
                </div>
                <div className="w-60 h-60 rounded-3xl overflow-hidden shadow-xl bg-[#e3e8f2]">
                  <img
                    alt="Patisserie dessert"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Registration Card Container */}
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <div className="w-full max-w-[540px] bg-white rounded-3xl shadow-[0_24px_50px_-12px_rgba(22,28,35,0.12),0_8px_20px_-4px_rgba(171,47,0,0.06)] overflow-hidden transition-all duration-300 relative border border-slate-100">
              {/* Top Accent Gradient Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#ab2f00] via-[#d53e02] to-[#006c49]" />

              <div className="p-6 sm:p-10 flex flex-col">
                {/* Header: Badge & Welcome Title */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#eef4fe] text-[#ab2f00] shadow-sm">
                      <Gift className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#6cf8bb]/30 text-[#00714d] text-[11px] uppercase tracking-widest font-bold">
                      $10 Welcome Offer
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161c23] tracking-tight mb-2">
                    Create your Crave account
                  </h1>
                  <p className="text-sm text-[#5b4139] max-w-sm leading-relaxed">
                    Join the Crave Guild to enjoy curated artisan kitchens, priority courier dispatch, and special culinary savings.
                  </p>
                </div>

                {/* Social One-Click Auth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setName('Demo Customer');
                      setEmail('customer@gmail.com');
                      setPassword('Password@123');
                    }}
                    className="flex items-center justify-center gap-3 h-12 px-4 rounded-xl bg-[#eef4fe] hover:bg-[#e9eef8] text-[#161c23] text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setName('Demo Customer');
                      setEmail('customer@gmail.com');
                      setPassword('Password@123');
                    }}
                    className="flex items-center justify-center gap-2.5 h-12 px-4 rounded-xl bg-[#eef4fe] hover:bg-[#e9eef8] text-[#161c23] text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.41-9.79-11.47-20.94-15.19-33.45-3.72-12.51-5.58-24.19-5.58-35.04 0-14.79 3.8-27.18 11.4-37.17 7.6-9.99 17.06-15.16 28.38-15.52 4.58 0 9.78 1.19 15.6 3.57 5.82 2.39 9.68 3.63 11.58 3.73 1.52-.1 5.58-1.39 12.18-3.86 6.59-2.47 11.9-3.53 15.93-3.18 12.07.76 21.6 5.09 28.58 12.99-10.43 6.31-15.54 15.02-15.33 26.14.22 8.7 3.49 16.03 9.81 22 6.32 5.97 13.9 9.4 22.74 10.29-2.39 7.06-5.27 14.17-8.64 21.32zm-28.72-113.88c0 7.07-2.6 13.68-7.81 19.83-6.42 7.4-14.12 11.83-23.11 11.08-.22-1.3-.33-2.4-.33-3.26 0-7.07 2.82-13.9 8.47-20.51 2.82-3.37 6.41-6.19 10.75-8.47 4.34-2.28 8.36-3.48 12.03-3.57.11 1.63.11 3.26.11 4.9z" />
                    </svg>
                    <span>Sign up with Apple</span>
                  </button>
                </div>

                {/* Section Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full h-px bg-[#e3e8f2]" />
                  <span className="absolute px-4 bg-white text-[11px] text-[#5b4139] font-medium tracking-wide">
                    or register with email
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  {/* Full Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#161c23] tracking-tight">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 text-[#5b4139] w-4 h-4 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        required
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#eef4fe] focus:bg-white text-[#161c23] placeholder-[#5b4139]/60 text-sm outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#ab2f00]"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#161c23] tracking-tight">
                        Email Address
                      </label>
                      {isEmailValid && (
                        <span className="text-[11px] text-[#006c49] font-semibold flex items-center gap-1 transition-opacity">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 text-[#5b4139] w-4 h-4 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        required
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#eef4fe] focus:bg-white text-[#161c23] placeholder-[#5b4139]/60 text-sm outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#ab2f00]"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone (Optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#161c23] tracking-tight">
                      Mobile Phone (for delivery SMS)
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 text-[#5b4139] w-4 h-4 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#eef4fe] focus:bg-white text-[#161c23] placeholder-[#5b4139]/60 text-sm outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#ab2f00]"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#161c23] tracking-tight">
                        Create Password (min. 8 characters)
                      </label>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 text-[#5b4139] w-4 h-4 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        minLength={8}
                        className="w-full h-12 pl-11 pr-12 rounded-xl bg-[#eef4fe] focus:bg-white text-[#161c23] placeholder-[#5b4139]/60 text-sm outline-none transition-all shadow-sm focus:ring-2 focus:ring-[#ab2f00]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 p-1.5 text-[#5b4139] hover:text-[#161c23] rounded-lg transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Guild Checkboxes */}
                  <div className="space-y-2 pt-1 text-xs text-[#5b4139]">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 shadow-sm mt-0.5 ${
                          agreeTerms
                            ? 'bg-[#ab2f00] text-white'
                            : 'bg-[#eef4fe] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        I agree to Crave's{' '}
                        <a href="#" className="underline font-bold text-[#161c23]">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="underline font-bold text-[#161c23]">
                          Privacy Policy
                        </a>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={optInGuild}
                        onChange={(e) => setOptInGuild(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 shadow-sm mt-0.5 ${
                          optInGuild
                            ? 'bg-[#006c49] text-white'
                            : 'bg-[#eef4fe] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>
                        Enroll in Crave Guild Pass to unlock zero delivery fees and
                        exclusive culinary tasting events.
                      </span>
                    </label>
                  </div>

                  {/* Primary Submit CTA */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`mt-2 relative w-full h-12 rounded-full font-bold text-sm shadow-[0_8px_16px_-4px_rgba(171,47,0,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(171,47,0,0.45)] transition-all flex items-center justify-center gap-2 overflow-hidden active:scale-[0.99] ${
                      isSuccess
                        ? 'bg-[#006c49] text-white'
                        : 'bg-[#ab2f00] hover:bg-[#d53e02] text-white'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : isSuccess ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Account Created!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 tracking-wide">
                        Create Account &amp; Claim $10 Off
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </button>
                </form>

                {/* Existing Account Prompt */}
                <div className="mt-5 text-center text-xs text-[#5b4139]">
                  Already a Crave Guild member?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-[#ab2f00] hover:underline"
                  >
                    Sign In
                  </Link>
                </div>

                {/* Security Trust Badges */}
                <div className="mt-4 pt-3 border-t border-[#e3e8f2] flex items-center justify-center gap-2 text-[11px] text-[#5b4139]">
                  <ShieldCheck className="w-4 h-4 text-[#006c49]" />
                  <span>256-bit SSL encrypted · Verified Crave Single Sign-On</span>
                </div>
              </div>

              {/* Partner Portal Switcher Strip */}
              <div className="w-full bg-[#e9eef8] py-3 px-6 text-center text-xs text-[#5b4139]">
                Are you a food partner? Join as{' '}
                <a
                  href="http://localhost:3002"
                  className="text-[#161c23] font-bold hover:text-[#ab2f00] underline underline-offset-2 ml-1 transition-colors"
                >
                  Restaurant Kitchen
                </a>
                ,{' '}
                <a
                  href="http://localhost:3003"
                  className="text-[#161c23] font-bold hover:text-[#ab2f00] underline underline-offset-2 mx-1 transition-colors"
                >
                  Courier Fleet
                </a>
                , or{' '}
                <a
                  href="http://localhost:3004"
                  className="text-[#161c23] font-bold hover:text-[#ab2f00] underline underline-offset-2 ml-1 transition-colors"
                >
                  Admin Operations
                </a>
                .
              </div>
            </div>

            {/* Active Perks Pill Rail */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[#5b4139] text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4fe] shadow-sm">
                <Truck className="w-4 h-4 text-[#006c49]" />
                <span>Zero Guild Delivery Fee</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4fe] shadow-sm">
                <Sparkles className="w-4 h-4 text-[#ab2f00]" />
                <span>Artisan Certified Kitchens</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4fe] shadow-sm">
                <Clock className="w-4 h-4 text-[#a73400]" />
                <span>Real-time Courier Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#eef4fe] border-t border-[#e4beb4]/30 mt-auto">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#ab2f00] flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                <span className="text-lg font-bold text-[#161c23]">Crave</span>
              </div>
              <p className="text-xs text-[#5b4139] max-w-sm mb-4 leading-relaxed">
                Curated artisan dining and neighborhood gourmet favorites delivered fresh to your doorstep with meticulous craft.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2b3138] text-white hover:opacity-90 transition-opacity"
                >
                  <Smartphone className="w-4 h-4" />
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400">
                      Download on
                    </span>
                    <span className="text-xs font-semibold leading-none">
                      App Store
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2b3138] text-white hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.3 0 .58.09.81.25l13.5 8.5c.67.42.87 1.3.45 1.97-.12.19-.27.35-.45.46l-13.5 8.5c-.23.16-.51.25-.81.25-.83 0-1.5-.67-1.5-1.43z" />
                  </svg>
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400">
                      Get it on
                    </span>
                    <span className="text-xs font-semibold leading-none">
                      Google Play
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161c23] mb-3">
                Discover
              </h3>
              <ul className="space-y-2 text-xs text-[#5b4139]">
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Artisan Bakery</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Farm to Table</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Wood-fired Pizza</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Handcrafted Sushi</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Plant-based &amp; Vegan</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161c23] mb-3">
                Partner
              </h3>
              <ul className="space-y-2 text-xs text-[#5b4139]">
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Become a Crave Chef</a></li>
                <li><a href="http://localhost:3003" className="hover:text-[#ab2f00] transition-colors">Courier Fleet</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Corporate Catering</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Culinary Grants</a></li>
                <li><a href="http://localhost:3002" className="hover:text-[#ab2f00] transition-colors">Merchant Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161c23] mb-3">
                Support
              </h3>
              <ul className="space-y-2 text-xs text-[#5b4139]">
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Live Chat Support</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Order Tracking FAQ</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Dietary Standards</a></li>
                <li><a href="#" className="hover:text-[#ab2f00] transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e4beb4]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5b4139]">
            <p>© 2026 Crave Technologies Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#" className="hover:text-[#161c23] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#161c23] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#161c23] transition-colors">Cookie Preferences</a>
              <a href="#" className="hover:text-[#161c23] transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
