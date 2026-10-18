'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User as UserIcon, LogOut, Shield } from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NavbarAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const rawGateway = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
      const primaryUrl = rawGateway.endsWith('/auth/logout') ? rawGateway : `${rawGateway}/auth/logout`;
      await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      document.cookie = 'access_token=; path=/; max-age=0';
      setUser(null);
      window.location.href = '/login';
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-semibold text-white bg-[#ab2f00] hover:bg-[#8f2700] rounded-lg shadow-sm transition"
        >
          Register
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2.5">
        <Link
          href="/orders"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#ab2f00] hover:bg-[#ffdbd1]/30 rounded-xl transition"
        >
          <span>Past Orders</span>
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-2 bg-slate-100 hover:bg-[#ffdbd1]/30 py-1.5 px-3 rounded-full border border-slate-200/80 hover:border-[#ab2f00]/40 transition group"
        >
          <div className="w-6 h-6 rounded-full bg-[#ab2f00] text-white flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 group-hover:text-[#ab2f00] transition-colors leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] font-semibold text-[#006c49] uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 text-sm font-semibold text-white bg-[#ab2f00] hover:bg-[#8f2700] rounded-lg shadow-sm transition"
      >
        Register
      </Link>
    </div>
  );
}
