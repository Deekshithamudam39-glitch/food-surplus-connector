'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({ expiresAt, onExpire, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Claim Expired (30m exceeded)
      </span>
    );
  }

  const isLowTime = timeLeft.minutes < 5;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isLowTime
          ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-300'
          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      } ${className}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-amber-600' : 'text-emerald-600'}`} />
      <span>
        {timeLeft.minutes}m {timeLeft.seconds.toString().padStart(2, '0')}s pickup window left
      </span>
    </span>
  );
}
