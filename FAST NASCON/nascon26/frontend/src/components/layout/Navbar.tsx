'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserRole } from '@/types';
import { 
  Building2, 
  ShieldCheck, 
  User as UserIcon, 
  Crown, 
  Bell, 
  LogOut, 
  Sparkles,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ onMobileMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const { user, logout, setDemoUser } = useAuth();
  const { toast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRoleSwitch = (role: UserRole) => {
    setDemoUser(role);
    setDropdownOpen(false);
    toast.info('Role Switched', `Viewing dashboard with ${role.toUpperCase()} permissions.`);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
            <Crown className="w-3 h-3 text-amber-500" /> Owner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 border border-indigo-500/30">
            <ShieldCheck className="w-3 h-3 text-indigo-500" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            <UserIcon className="w-3 h-3 text-emerald-500" /> Sales Rep
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight text-lg leading-tight flex items-center gap-1">
                  Unified<span className="text-brand-600">CRM</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                  FAST NASCON 2026
                </span>
              </div>
            </Link>

            {/* Pill Tag from mockup */}
            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-3 py-1 bg-slate-100/90 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Multi-tenant Workspace Active
            </div>
          </div>

          {/* Right: Workspace badge, Role switcher, User menu */}
          <div className="flex items-center gap-3">
            {/* Active Workspace */}
            {user?.workspace_name && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[130px] truncate">{user.workspace_name}</span>
              </div>
            )}

            {/* Judge Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 transition-colors text-xs font-medium text-slate-800 border border-slate-200"
              >
                <span>Role:</span>
                {getRoleBadge(user?.role)}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-slide-up">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Judge Role Switcher
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('owner')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                      user?.role === 'owner' ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" /> Workspace Owner
                    </span>
                    {user?.role === 'owner' && <span className="text-[10px] text-amber-600 font-bold">Active</span>}
                  </button>

                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                      user?.role === 'admin' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" /> Workspace Admin
                    </span>
                    {user?.role === 'admin' && <span className="text-[10px] text-indigo-600 font-bold">Active</span>}
                  </button>

                  <button
                    onClick={() => handleRoleSwitch('user')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                      user?.role === 'user' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-emerald-500" /> Standard User (Rep)
                    </span>
                    {user?.role === 'user' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <Link
              href="/pipeline"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Escalation Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </Link>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                toast.info('Signed Out', 'You have been logged out.');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
