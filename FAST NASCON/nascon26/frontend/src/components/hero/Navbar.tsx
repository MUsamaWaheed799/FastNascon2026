'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronDown, Menu, X } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="flex items-center justify-between h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-serif font-black text-lg shadow-sm">
            ✦
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
            Unified Platform
          </span>
        </Link>

        {/* Center Pill-Style Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-full border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold transition-colors">
              <span>PRODUCT</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>
          </div>

          <Link
            href="#pricing"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            PRICING
          </Link>

          <Link
            href="#unified-ai"
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-violet-600 hover:bg-violet-50 font-bold transition-colors"
          >
            <span>UNIFIED AI</span>
            <Sparkles className="w-3 h-3 text-violet-500 fill-violet-500/20" />
          </Link>

          <Link
            href="#integrations"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            INTEGRATIONS
          </Link>

          <div className="relative group">
            <button className="flex items-center gap-1 px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              <span>RESOURCES</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1 px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-slate-100/70 transition-colors">
              <span>CONTACT US</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </nav>

        {/* Right CTA Group */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
          >
            Log in
          </Link>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Free 14-Day Trial
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-200 space-y-3">
          <Link href="/dashboard" className="block text-xs font-bold text-slate-900 py-1.5">
            Product & Pipeline
          </Link>
          <Link href="/dashboard" className="block text-xs font-semibold text-slate-600 py-1.5">
            Pricing
          </Link>
          <Link href="/dashboard" className="block text-xs font-semibold text-violet-600 py-1.5">
            Unified AI Features
          </Link>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link href="/auth/login" className="text-xs font-bold text-slate-700">
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
            >
              Free 14-Day Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
