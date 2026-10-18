'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
import { Navbar } from './Navbar';
import { FloatingNodes } from './FloatingNodes';
import { DashboardPreview } from './DashboardPreview';

export function HeroSection() {
  return (
    <div className="relative min-h-screen bg-[#F4F7FA] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-orange-200/40 via-violet-200/30 to-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Hero Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* Floating Interactive Inbound & Integration Nodes */}
        <FloatingNodes />

        {/* Central Content */}
        <div className="relative z-20 text-center max-w-3xl mx-auto mt-4 sm:mt-8">
          {/* Eyebrow Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 text-violet-700 text-xs font-semibold shadow-xs hover:border-violet-300 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-violet-500 fill-violet-500/30" />
            <span>Unified lead management and business automation</span>
          </div>

          {/* Main Headline (Bold, High-Contrast Serif / Geometric Headline) */}
          <h1 className="mt-6 text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-slate-900 leading-[1.08] font-serif">
            Never lose a lead. <br />
            <span className="text-slate-900 font-serif">Close every deal.</span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-sans">
            One connected platform to manage your pipeline, assign incoming leads, collect payments, and automate tracking.
          </p>

          {/* Call-To-Action Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 group"
            >
              <span>Start 14-day free trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/pipeline"
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-sm font-bold border border-slate-300/90 shadow-xs hover:shadow transition-all duration-200"
            >
              Book free demo
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">🎉 All features included</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">🎉 No credit card required!</span>
          </div>

          {/* G2 Reviews Social Proof */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
            {/* Google / G2 Logo Badge */}
            <div className="w-5 h-5 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center font-bold text-[10px] text-orange-500">
              G²
            </div>
            <span className="font-bold text-slate-900">Reviews</span>
            <span className="font-extrabold text-slate-900">4.8</span>
            <div className="flex text-amber-500 text-sm">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i}>{star}</span>
              ))}
            </div>
            <span className="text-slate-400 font-normal">(1,458)</span>
          </div>
        </div>

        {/* Bottom Interactive Dashboard Preview */}
        <DashboardPreview />
      </div>
    </div>
  );
}
