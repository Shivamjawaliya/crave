'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { User as UserIcon, LogOut, Package, ChevronDown, Shield } from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NavbarAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

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
      setDropdownOpen(false);
      window.location.href = '/login';
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/login"
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#ab2f00] hover:bg-[#8f2700] rounded-lg shadow-sm transition"
        >
          Register
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Profile Trigger Button (Past Orders and Sign Out removed from top header bar) */}
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 sm:gap-2.5 py-1 sm:py-1.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 rounded-full border transition group ${
            dropdownOpen
              ? 'bg-[#ffdbd1]/40 border-[#ab2f00]/50 shadow-sm'
              : 'bg-slate-100 hover:bg-[#ffdbd1]/30 border-slate-200/80 hover:border-[#ab2f00]/40'
          }`}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="w-7 h-7 rounded-full bg-[#ab2f00] text-white flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform shadow-sm">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 group-hover:text-[#ab2f00] transition-colors leading-tight max-w-[110px] truncate">
              {user.name}
            </span>
            <span className="text-[9px] font-extrabold text-[#006c49] uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-[#ab2f00]' : ''
            }`}
          />
        </button>

        {/* Profile Section Dropdown Popover */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* User Details Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ab2f00] to-[#e64000] text-white flex items-center justify-center text-sm font-black shadow-md shadow-[#ab2f00]/20">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                <span className="inline-block mt-0.5 text-[9px] font-extrabold text-[#006c49] bg-[#006c49]/10 px-2 py-0.2 rounded-full uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Menu Options: Profile & Past Orders relocated here */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-[#ab2f00] hover:bg-[#ffdbd1]/20 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-900">My Profile</span>
                  <span className="text-[10px] text-slate-500">Addresses & account info</span>
                </div>
              </Link>

              <Link
                href="/orders"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-[#ab2f00] hover:bg-[#ffdbd1]/20 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-[#ffdbd1]/40 text-[#ab2f00] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-900">Past Orders</span>
                  <span className="text-[10px] text-slate-500">Track orders & reorder</span>
                </div>
              </Link>
            </div>

            {/* Sign Out relocated here */}
            <div className="pt-1 mt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-red-100/60 text-red-600 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span>Sign Out</span>
                  <span className="text-[10px] text-red-400 font-normal">Log out of your account</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href="/login"
        className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#ab2f00] hover:bg-[#8f2700] rounded-lg shadow-sm transition"
      >
        Register
      </Link>
    </div>
  );
}
