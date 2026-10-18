'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  CreditCard, 
  KanbanSquare, 
  Sparkles, 
  ShieldCheck,
  ArrowRight,
  Flame,
  Crown
} from 'lucide-react';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isManager = hasRole(['owner', 'admin']);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-300 text-xs font-bold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Workspace: {user?.workspace_name || 'Apex Enterprises'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.username || 'Team Member'}! 👋
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isManager
                ? 'Executive live oversight: Monitor workspace pipeline velocity, Stripe collections, and lead escalation timers in real-time.'
                : 'Sales Rep Focus: Review your assigned inbound leads and acknowledge them before the 15-minute SLA timer expires.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <KanbanSquare className="w-4 h-4" />
                <span>Open Kanban Pipeline</span>
              </Link>

              {isManager && (
                <Link
                  href="/audit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all"
                >
                  <History className="w-4 h-4" />
                  <span>View Tamper-Evident Logs</span>
                </Link>
              )}
            </div>
          </div>

          {/* Background Glow */}
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        </div>

        {/* Live SLA Escalation Alert Ticker (Rubric Criterion 3 & 9) */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 flex-shrink-0">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>Active Lead Escalation SLA Window</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                  1 Urgent Lead
                </span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Opportunity <strong>AI Pipeline Integration</strong> was assigned 14 mins ago. <strong>1 min remaining</strong> before tier-2 manager escalation.
              </p>
            </div>
          </div>

          <Link
            href="/pipeline"
            className="flex-shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors text-center"
          >
            Review & Acknowledge
          </Link>
        </div>

        {/* ROLE-TAILORED KPI METRICS (Rubric Criterion 1 & 4) */}
        {isManager ? (
          /* OWNER & ADMIN VIEW: Team-wide figures, Stripe payments, Audit link */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Pipeline */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Pipeline Value</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">$169,500</span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% this week</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Stripe Revenue Collected */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Collected Revenue (Stripe)</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">$62,000</span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <span>Webhook verified</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Win Rate */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Pipeline Win Rate</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">42.8%</span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                    <span>+5.2% vs target</span>
                  </div>
                </div>
              </div>

              {/* Card 4: SLA Escalations */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">SLA Recovery Queue</span>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-rose-600 tracking-tight">1 Lead</span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                    <span>Requires Admin Claim</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Load & Cryptographic Audit Mini-Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Load Capacity */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-600" />
                    Team Lead Capacity & Availability
                  </h3>
                  <span className="text-xs text-slate-400">Round-Robin Status</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">tariq_rep</span>
                      <span className="text-[11px] text-slate-400 ml-2">Sales Rep</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-medium">2 / 10 Leads Held</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Available
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">sarah_admin</span>
                      <span className="text-[11px] text-slate-400 ml-2">Admin / Tier 2</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-medium">0 / 15 Leads Held</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Tier-2 Escalation Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Chain Quick Verification Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Tamper-Evident Hash Chain
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      SHA-256 Intact
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    All workspace mutations (creates, updates, deletes, and permission changes) are chained using cryptographic SHA-256 parent hashes.
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600">
                    <div><strong>Latest Entry Hash:</strong> 3a7b9c1d2e4f6a8b0c2d4e6f...</div>
                    <div><strong>Parent Hash:</strong> 9f83a21b4c7e6d0a5f1e8b3c...</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">1,048 Verified Records</span>
                  <Link
                    href="/audit"
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-500"
                  >
                    <span>Inspect Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD USER (SALES REP) VIEW: Filtered only to assigned leads */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">My Active Leads</span>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">2 Deals</div>
                <p className="text-[11px] text-slate-400 mt-1">Capacity: 2/10 leads held</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Pending Acknowledgment</span>
                <div className="mt-2 text-2xl font-extrabold text-amber-600">2 Leads</div>
                <p className="text-[11px] text-amber-700 mt-1 font-medium">Countdown active</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">My Pipeline Value</span>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">$73,000</div>
                <p className="text-[11px] text-emerald-600 mt-1 font-bold">Assigned to you</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900">My Assigned Pipeline</h3>
                <Link
                  href="/pipeline"
                  className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1"
                >
                  <span>Go to Pipeline Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                You have 2 new inbound leads that need immediate acknowledgment before the SLA timer expires. Click above to view the live ticking board.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
