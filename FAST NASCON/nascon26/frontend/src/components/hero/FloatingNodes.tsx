'use client';

import React from 'react';
import { 
  PhoneCall, 
  Bell, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function FloatingNodes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 hidden xl:block">
      {/* Background SVG Connectivity Curves (Left & Right Node Grids) */}
      <svg
        className="absolute inset-0 w-full h-full text-slate-300/80"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Left Side Connector Paths */}
        <path
          d="M 60 160 C 180 180, 240 260, 380 280"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 120 280 C 220 290, 280 300, 390 320"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 80 440 C 200 420, 290 380, 390 340"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Left Node Anchor Dots */}
        <circle cx="60" cy="160" r="3.5" fill="#94A3B8" />
        <circle cx="210" cy="220" r="3" fill="#CBD5E1" />
        <circle cx="380" cy="280" r="4" fill="#3B82F6" />
        <circle cx="390" cy="320" r="4" fill="#10B981" />
        <circle cx="390" cy="340" r="4" fill="#F97316" />

        {/* Right Side Connector Paths */}
        <path
          d="M 1220 160 C 1080 180, 1000 240, 890 280"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 1180 290 C 1080 290, 980 300, 880 320"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 1200 450 C 1080 430, 980 380, 880 340"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Right Node Anchor Dots */}
        <circle cx="1220" cy="160" r="3.5" fill="#94A3B8" />
        <circle cx="1060" cy="230" r="3" fill="#CBD5E1" />
        <circle cx="890" cy="280" r="4" fill="#6366F1" />
        <circle cx="880" cy="320" r="4" fill="#10B981" />
        <circle cx="880" cy="340" r="4" fill="#F97316" />
      </svg>

      {/* ========================================================
          LEFT SIDE: Inbound Channels & Customer Chat Flow
      ======================================================== */}
      <div className="absolute left-6 top-16 w-80 space-y-4">
        {/* WhatsApp Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 p-2 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 hover:-translate-y-1 transition-all duration-300 w-fit">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-tight">
            WhatsApp Response Sent!
          </span>
        </div>

        {/* Customer Message Mockup 1 */}
        <div className="pointer-events-auto p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex items-start gap-3 w-72 hover:-translate-y-1 transition-all duration-300">
          <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-900 flex-shrink-0 ring-2 ring-white">
            👨‍💼
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-2 bg-slate-200 rounded-full w-4/5" />
            <div className="h-2 bg-slate-100 rounded-full w-3/5" />
          </div>
        </div>

        {/* SMS Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 p-2 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 hover:-translate-y-1 transition-all duration-300 w-fit ml-8">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-tight">
            SMS Response Sent!
          </span>
        </div>

        {/* WhatsApp Dialog Bubble */}
        <div className="pointer-events-auto p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex items-start gap-3 w-64 hover:-translate-y-1 transition-all duration-300">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-2 bg-slate-200 rounded-full w-full" />
            <div className="h-2 bg-slate-100 rounded-full w-2/3" />
          </div>
        </div>

        {/* Call Active Lead & Alert Bell */}
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-2 p-2 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 hover:-translate-y-1 transition-all duration-300">
            <PhoneCall className="w-3.5 h-3.5 text-slate-700" />
            <div>
              <div className="text-[11px] font-bold text-slate-800">Call</div>
              <div className="text-[9px] text-slate-400">Active Lead</div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 p-2 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 hover:-translate-y-1 transition-all duration-300">
            <div className="relative">
              <Bell className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400">incoming</div>
              <div className="text-[11px] font-bold text-slate-800">Rapid response</div>
            </div>
          </div>
        </div>

        {/* Customer Avatar Pill */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 px-3 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200/80 w-fit">
          <span className="text-xs">👩‍🦰</span>
          <span className="text-[11px] font-semibold text-slate-700">customer Response Sent!</span>
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDE: Integrations, Calendar & Revenue Desk
      ======================================================== */}
      <div className="absolute right-6 top-16 w-80 space-y-4 flex flex-col items-end">
        {/* Customer Response Sent Pill */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 px-3 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200/80 hover:-translate-y-1 transition-all duration-300">
          <span className="text-xs">👩‍💼</span>
          <span className="text-[11px] font-semibold text-slate-700">customer Response Sent!</span>
        </div>

        {/* Stripe Collected Revenue Card */}
        <div className="pointer-events-auto flex items-center gap-2.5 p-2 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 hover:-translate-y-1 transition-all duration-300 w-fit">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            S
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Stripe test mode</div>
            <div className="text-xs font-bold text-slate-800">Collected revenue</div>
          </div>
        </div>

        {/* Flowaling Progress Status */}
        <div className="pointer-events-auto p-2.5 px-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-1 w-44 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Flowaling</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Google Calendar Connected */}
        <div className="pointer-events-auto flex items-center gap-2.5 p-2 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 hover:-translate-y-1 transition-all duration-300 w-fit mr-4">
          <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            31
          </div>
          <span className="text-xs font-semibold text-slate-800 tracking-tight">
            Google Calendar connected
          </span>
        </div>

        {/* Customer Fast Response Card */}
        <div className="pointer-events-auto p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 w-64 hover:-translate-y-1 transition-all duration-300 space-y-2">
          <div className="text-[10px] text-slate-400 font-semibold">Message</div>
          <div className="text-[11px] font-bold text-slate-800">fast response on any channel</div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs">👨‍💼</span>
            <span className="text-[10px] text-slate-500 font-medium">customer Response Sent</span>
          </div>
        </div>

        {/* Quick Box Pill */}
        <div className="pointer-events-auto p-1.5 px-3 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 text-[10px] text-slate-500 font-medium shadow-xs">
          Quick box
        </div>
      </div>
    </div>
  );
}
