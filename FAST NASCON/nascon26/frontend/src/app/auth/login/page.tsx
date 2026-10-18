'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_PROFILES } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { 
  Sparkles, 
  Lock, 
  User, 
  Building2, 
  ArrowRight, 
  Crown, 
  ShieldCheck, 
  UserCheck, 
  Loader2,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  PhoneCall
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, setDemoUser } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Validation Error', 'Please enter your username and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome Back!', 'Authenticated into workspace successfully.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Authentication Failed', err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'owner' | 'admin' | 'user') => {
    setDemoUser(role);
    toast.success(
      `Logged in as ${role.toUpperCase()}`,
      `Loaded demo session for ${DEMO_PROFILES[role].username} in ${DEMO_PROFILES[role].workspace_name}.`
    );
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative floating pills inspired by the NASCON reference screenshot */}
      <div className="absolute top-8 left-8 hidden lg:flex items-center gap-2 p-2 px-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 text-xs font-semibold text-slate-700 animate-slide-up">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
        <span>WhatsApp Inbound Active!</span>
      </div>

      <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-2 p-2 px-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 text-xs font-semibold text-slate-700">
        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
        <span>Stripe Live Webhook: $62,000 Collected</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Mockup Badge Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Unified lead management and business automation</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Never lose a lead. Close every deal.
        </h1>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
          One connected platform to manage your pipeline, assign incoming leads, collect payments, and automate tracking.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_owner or charlie"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Sign In to Workspace</span>
            </button>
          </form>

          {/* Quick Demo Logins for Judges */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Judges / Rapid Testing 1-Click Access
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('owner')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 transition-colors text-center"
              >
                <Crown className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-[11px] font-bold">Owner</span>
                <span className="text-[9px] text-amber-700">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 transition-colors text-center"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-[11px] font-bold">Admin</span>
                <span className="text-[9px] text-indigo-700">Audit & Ops</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('user')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition-colors text-center"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-bold">Sales Rep</span>
                <span className="text-[9px] text-emerald-700">My Leads</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Need a new workspace?{' '}
              <Link href="/auth/register" className="font-bold text-brand-600 hover:text-brand-500">
                Register Workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
