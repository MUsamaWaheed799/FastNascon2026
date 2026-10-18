'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  Clock, 
  CreditCard,
  KanbanSquare,
  ShieldCheck
} from 'lucide-react';

export function DashboardPreview() {
  return (
    <div className="relative mt-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* 100% Response Rate Floating Badge */}
      <div className="absolute -top-6 right-8 sm:right-16 z-20 flex items-center gap-2 p-2 px-4 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span>100% response rate</span>
      </div>

      {/* Glassmorphic Dashboard Peek Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/80 border border-slate-200/90 relative overflow-hidden">
        {/* Top Mini Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              ✦
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Live Workspace Pipeline</div>
              <div className="text-[10px] text-slate-400">Apex Growth Enterprises • Multi-Tenant Active</div>
            </div>
          </div>

          <Link
            href="/pipeline"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-colors"
          >
            <span>Open Full Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Metric Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Pipeline Value</span>
              <DollarSign className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">$169,500</div>
            <span className="text-[10px] text-emerald-600 font-bold">18 deals in active flight</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>SLA Escalation Window</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-amber-600 mt-1">15 Minutes</div>
            <span className="text-[10px] text-amber-700 font-medium">Auto-reassigns to Manager</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Stripe Synced Revenue</span>
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">$62,000</div>
            <span className="text-[10px] text-indigo-600 font-bold">100% Webhook verified</span>
          </div>
        </div>

        {/* Live Kanban Pipeline Snapshot */}
        <div className="grid grid-cols-3 gap-3">
          {/* Column 1 */}
          <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>New / Inbound</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">2 Leads</span>
            </div>

            {/* Lead 1 with Ticking SLA Timer */}
            <div className="p-2.5 bg-white rounded-xl border border-amber-300 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-800">Enterprise Cloud Migration</div>
              <div className="text-[10px] text-slate-400">Dr. Sarah Connor • $45,000</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>11:42 to Escalate</span>
              </div>
            </div>

            {/* Lead 2 Urgent */}
            <div className="p-2.5 bg-white rounded-xl border border-rose-400 shadow-2xs space-y-1 animate-pulse">
              <div className="text-xs font-bold text-slate-800">AI Lead Routing Suite</div>
              <div className="text-[10px] text-slate-400">Elena Rostova • $28,000</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                <span>⏱ 00:58 ESCALATING!</span>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>Qualified & Proposal</span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px]">3 Deals</span>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-800">Multi-tenant ERP Setup</div>
              <div className="text-[10px] text-slate-400">Marcus Brody • $19,500</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                ✓ Acknowledged
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>Closed Won</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">1 Won</span>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-1">
              <div className="text-xs font-bold text-slate-800">WhatsApp & Stripe Suite</div>
              <div className="text-[10px] text-slate-400">Indus FinTech • $62,000</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                Paid in Full
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
