'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Shield,
  MapPin,
  Plus,
  Trash2,
  Check,
  Flame,
  ShoppingBag,
  Package,
  Calendar,
  Edit2,
  LogOut,
  ArrowRight,
  Briefcase,
  Home,
  CheckCircle2,
} from 'lucide-react';
import NavbarAuth from '../../components/NavbarAuth';
import AddressModal from '../../components/AddressModal';
import { useCartStore } from '../../lib/store';
import { useAddressStore, UserAddress } from '../../lib/address.store';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [message, setMessage] = useState('');

  const { items: cartItems, getSubtotalPaise } = useCartStore();
  const cartSubtotal = (getSubtotalPaise() / 100).toFixed(2);
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const {
    addresses,
    selectedAddress,
    openModal,
    fetchAddresses,
    setDefaultAddress,
    deleteAddress,
    selectAddress,
  } = useAddressStore();

  useEffect(() => {
    async function loadData() {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(stored);
        setNewName(user.name);

        const primaryUrl =
          process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

        // 1. Fetch user details
        const userRes = await fetch(`${primaryUrl}/users/${user.id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile(userData);
          setNewName(userData.name);
        } else {
          setProfile(user);
        }

        // 2. Fetch user addresses
        await fetchAddresses(user.id);

        // 3. Fetch past orders count
        const ordersRes = await fetch(`${primaryUrl}/orders/customer/${user.id}`);
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setOrderCount(orders.length);
        }
      } catch (err) {
        console.error('Failed to load user profile data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchAddresses]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newName.trim()) return;

    setIsUpdating(true);
    setMessage('');

    try {
      const primaryUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${primaryUrl}/users/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => (prev ? { ...prev, name: updated.name } : null));

        // Update localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.name = updated.name;
          localStorage.setItem('user', JSON.stringify(u));
        }

        setIsEditingName(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetDefault = async (addressId?: string) => {
    if (!profile || !addressId) return;
    await setDefaultAddress(profile.id, addressId);
    setMessage('Default address updated!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (addressId?: string) => {
    if (!profile || !addressId) return;
    if (confirm('Delete this saved address?')) {
      await deleteAddress(profile.id, addressId);
      setMessage('Address deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="bg-[#f7f9ff] text-[#161c23] min-h-screen flex flex-col font-sans selection:bg-[#ffdbd1] selection:text-[#3a0a00]">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#f7f9ff]/95 backdrop-blur-xl border-b border-[#e4beb4]/30 shadow-[0_4px_20px_-4px_rgba(22,28,35,0.04)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] flex items-center justify-center text-white shadow-md shadow-[#ab2f00]/25 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <span className="font-serif font-black text-2xl tracking-tight text-[#161c23]">
                Crave
              </span>
            </Link>

            <button
              type="button"
              onClick={openModal}
              className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 hover:opacity-80 transition text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-[#ffdbd1] flex items-center justify-center text-[#ab2f00] group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Deliver to
                </span>
                <span className="text-xs font-bold text-[#161c23] truncate max-w-[170px]">
                  {selectedAddress.addressLine} ▾
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cart"
              className="flex items-center gap-2 bg-[#ab2f00] hover:bg-[#8f2700] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md shadow-[#ab2f00]/25 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({totalCartCount}) • ₹{cartSubtotal}</span>
            </Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* 2. SUBHEADER */}
      <section className="bg-white border-b border-slate-200/80 py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ab2f00] bg-[#ffdbd1] px-3 py-1 rounded-full">
                Customer Account
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ● Active Member
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Profile & Addresses
            </h1>
            <p className="text-xs text-slate-600">
              Manage your personal info, saved delivery destinations, and order activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#ab2f00] bg-[#ffdbd1]/50 hover:bg-[#ffdbd1] rounded-2xl transition"
            >
              <Package className="w-4 h-4" />
              <span>View Past Orders ({orderCount})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT GRID */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#ab2f00] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Loading Profile Information...
            </p>
          </div>
        ) : !profile ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#ffdbd1] text-[#ab2f00] flex items-center justify-center mx-auto">
              <UserIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">Please sign in</h2>
              <p className="text-xs text-slate-600">
                You must be logged in to manage your profile and addresses.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-md shadow-[#ab2f00]/25 transition"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Profile Card & Quick Stats */}
            <div className="lg:col-span-4 space-y-6">
              {/* User Identity Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ab2f00] to-[#e64000] text-white flex items-center justify-center font-serif text-2xl font-black shadow-lg shadow-[#ab2f00]/20">
                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 truncate">
                        {profile.name}
                      </h2>
                    </div>
                    <span className="inline-block text-[10px] font-extrabold text-[#006c49] bg-[#006c49]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* Edit Name Form */}
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="space-y-3 pt-2">
                    <label className="text-xs font-extrabold text-slate-700 block">Update Display Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#ab2f00]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="flex-1 py-2 rounded-xl bg-[#ab2f00] text-white text-xs font-bold hover:bg-[#8f2700] transition"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Name</span>
                  </button>
                )}

                {/* Account metadata */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold">Role: {profile.role}</span>
                  </div>
                  {profile.createdAt && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold">
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Account</span>
                  </button>
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Activity Overview
                  </span>
                  <Flame className="w-4 h-4 text-[#ffdbd1]" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="bg-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">
                      Total Orders
                    </span>
                    <span className="text-2xl font-black">{orderCount}</span>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">
                      Saved Addresses
                    </span>
                    <span className="text-2xl font-black">{addresses.length}</span>
                  </div>
                </div>

                <Link
                  href="/orders"
                  className="w-full py-3 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>Go to Orders Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Address Management Section */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900">
                      Saved Delivery Addresses
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage your destination addresses saved in PostgreSQL. Select any address as default.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#ab2f00] hover:bg-[#8f2700] text-white text-xs font-bold shadow-md shadow-[#ab2f00]/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* List of addresses */}
                <div className="space-y-4">
                  {addresses.map((addr) => {
                    const isSelected =
                      (selectedAddress.id && addr.id === selectedAddress.id) ||
                      (!selectedAddress.id && addr.addressLine === selectedAddress.addressLine);

                    return (
                      <div
                        key={addr.id || addr.addressLine}
                        className={`p-5 rounded-2xl border-2 transition ${
                          isSelected
                            ? 'border-[#ab2f00] bg-[#fff5f2]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-[#ab2f00] text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {addr.label?.toLowerCase() === 'work' ? (
                                <Briefcase className="w-5 h-5" />
                              ) : (
                                <Home className="w-5 h-5" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {addr.label || 'Home'}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-[#006c49]/10 text-[#006c49] px-2.5 py-0.5 rounded-full font-bold">
                                    Default Delivery Address
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-[10px] bg-[#ab2f00] text-white px-2 py-0.5 rounded-full font-bold">
                                    Active for Ordering
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-800 font-semibold pt-0.5">
                                {addr.addressLine}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')} • Intercom available
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {!isSelected && (
                              <button
                                type="button"
                                onClick={() => selectAddress(addr)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                              >
                                Select
                              </button>
                            )}

                            {addr.id && !addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(addr.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#ffdbd1] text-slate-700 hover:text-[#ab2f00] text-xs font-bold transition"
                              >
                                Make Default
                              </button>
                            )}

                            {addr.id && addresses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDelete(addr.id)}
                                title="Delete address"
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Crave Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/cart" className="hover:underline">Cart & Checkout</Link>
              <Link href="/orders" className="hover:underline">Past Orders</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Address Switcher Modal */}
      <AddressModal />
    </div>
  );
}
