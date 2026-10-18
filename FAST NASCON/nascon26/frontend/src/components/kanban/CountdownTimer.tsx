'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CountdownTimerProps {
  assignedAt?: string | null;
  acknowledgedAt?: string | null;
  ackWindowMinutes?: number;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({
  assignedAt,
  acknowledgedAt,
  ackWindowMinutes = 15,
  onExpire,
  className = '',
}: CountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    // If already acknowledged, timer stops
    if (acknowledgedAt) {
      setSecondsRemaining(null);
      return;
    }

    if (!assignedAt) {
      setSecondsRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const assignedTime = new Date(assignedAt).getTime();
      const deadline = assignedTime + ackWindowMinutes * 60 * 1000;
      const now = Date.now();
      const diffSecs = Math.floor((deadline - now) / 1000);
      return diffSecs;
    };

    // Initial check
    const initial = calculateRemaining();
    setSecondsRemaining(initial);

    // Live ticking countdown interval
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      if (remaining === 0 && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [assignedAt, acknowledgedAt, ackWindowMinutes, onExpire]);

  // Case 1: Already Acknowledged
  if (acknowledgedAt) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Acknowledged</span>
      </div>
    );
  }

  // Case 2: No assignment time recorded yet
  if (secondsRemaining === null) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>Timer Ready</span>
      </div>
    );
  }

  // Case 3: Expired / Escalated
  if (secondsRemaining <= 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-300 animate-pulse ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        <span>ESCALATED (Window Expired)</span>
      </div>
    );
  }

  // Case 4: Live Ticking
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = secondsRemaining < 60; // Less than 1 minute left
  const isWarning = secondsRemaining < 300; // Less than 5 minutes left

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shadow-xs ${
        isUrgent
          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse-fast'
          : isWarning
          ? 'bg-amber-100 text-amber-800 border border-amber-300'
          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      } ${className}`}
      title={`Lead acknowledgment window: ${ackWindowMinutes} minutes`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-indigo-500" />
      )}
      <span>{formattedTime}</span>
      <span className="text-[10px] uppercase font-sans font-medium opacity-80">
        {isUrgent ? 'Escalating!' : 'to Escalate'}
      </span>
    </div>
  );
}
