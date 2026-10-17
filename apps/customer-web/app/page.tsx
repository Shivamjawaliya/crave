import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Clock, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import NavbarAuth from '../components/NavbarAuth';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-sm">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              FoodPlatform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart (0)</span>
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              My Orders
            </Link>
            <NavbarAuth />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-emerald-800 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-3 py-1 bg-emerald-700/60 text-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
            Fastest Delivery in Town
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Craving exceptional food delivered to your door?
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Explore authentic flavors, hand-crafted delicacies, and fresh meals prepared by the finest local restaurants.
          </p>

          <div className="max-w-2xl mx-auto relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-2 text-slate-800">
            <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search for restaurants, biryani, pizza, desserts..."
              className="w-full px-4 py-3 outline-none text-slate-900 placeholder-slate-400 font-medium"
            />
            <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold transition shrink-0">
              Find Food
            </button>
          </div>
        </div>
      </section>

      {/* App Dashboards Fast Switcher Bar */}
      <div className="bg-slate-100 border-b border-slate-200 py-3 px-4 text-xs font-medium text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span>Platform Role Hubs:</span>
          <div className="flex items-center gap-4">
            <a href="http://localhost:3002" className="text-emerald-700 hover:underline font-semibold">
              🍽️ Restaurant Dashboard (:3002)
            </a>
            <a href="http://localhost:3003" className="text-emerald-700 hover:underline font-semibold">
              🛵 Delivery Partner (:3003)
            </a>
            <a href="http://localhost:3004" className="text-emerald-700 hover:underline font-semibold">
              🛡️ Admin Console (:3004)
            </a>
            <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-semibold">
              📚 Swagger API Docs (:3001)
            </a>
          </div>
        </div>
      </div>

      {/* Featured Restaurants Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Top Rated Restaurants Near You
            </h2>
            <p className="text-slate-500 text-sm">
              Freshly approved kitchens serving hygienic and delicious meals.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group">
            <div className="h-48 bg-slate-200 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=700"
                alt="Spicy Bites Kitchen"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 flex items-center gap-1">
                ★ 4.8 (120+)
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                Spicy Bites Kitchen
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                Authentic Indian delicacies, smoky tandoor, and curries cooked to perfection.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Brigade Road
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> 25-35 mins
                </span>
                <Link
                  href="/restaurants/spicy-bites"
                  className="font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                >
                  View Menu <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Food Delivery & Restaurant Management Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>PostgreSQL</span>
            <span>Prisma</span>
            <span>Redis</span>
            <span>RabbitMQ</span>
            <span>Razorpay</span>
            <span>Docker</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
