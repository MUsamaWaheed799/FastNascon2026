'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  SlidersHorizontal, 
  History, 
  Users, 
  Clock, 
  AlertCircle,
  HelpCircle,
  PhoneCall,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();
  const isAdminOrOwner = hasRole(['owner', 'admin']);

  const navLinks = [
    {
      label: 'Live Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Kanban Pipeline',
      href: '/pipeline',
      icon: KanbanSquare,
      badge: 'Live Timers',
      badgeColor: 'bg-brand-100 text-brand-700',
    },
    {
      label: 'Custom Fields & Stages',
      href: '/settings/custom-fields',
      icon: SlidersHorizontal,
      adminOnly: true,
      badge: null,
    },
    {
      label: 'Hash-Chained Audit Logs',
      href: '/audit',
      icon: History,
      adminOnly: true,
      badge: 'Tamper-Evident',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              if (item.adminOnly && !isAdminOrOwner) return null;
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs border border-brand-200/60'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Channels & Automations (Mockups from NASCON prompt) */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Unified Channels
          </div>
          <div className="space-y-1.5 px-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Twilio WhatsApp
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Stripe Payments
              </span>
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/80 px-1.5 py-0.5 rounded-md">
                Live Sync
              </span>
            </div>
          </div>
        </div>

        {/* SLA Escalation Indicator */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Escalation Rule Active</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Unacknowledged leads escalate to managers in <strong>15 mins</strong>. Tier 1 reps ➔ Tier 2 manager.
          </p>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
            {user?.username?.slice(0, 2) || 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {user?.username || 'Guest'}
            </div>
            <div className="text-[11px] text-slate-400 truncate capitalize">
              Role: {user?.role || 'User'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
