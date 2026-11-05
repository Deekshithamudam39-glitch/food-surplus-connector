'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UtensilsCrossed, Lock, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Route according to user role
      if (redirect) {
        router.push(redirect);
      } else if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'DONOR') {
        router.push('/donor');
      } else if (data.user.role === 'RECEIVER') {
        router.push('/receiver');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/30">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to Food Surplus Connector
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials or choose a quick demo account below
        </p>
      </div>

      {/* QUICK DEMO ACCOUNT SELECTOR */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Instant Demo Accounts (Click to Fill):</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setDemoCredentials('admin@foodsurplus.org', 'Admin@123')}
            className="p-2 text-left bg-white border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
          >
            <span className="font-bold text-purple-700 block">👑 Admin</span>
            <span className="text-slate-500 text-[10px]">admin@foodsurplus.org</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('taj.hotel@donor.com', 'Password@123')}
            className="p-2 text-left bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <span className="font-bold text-blue-700 block">🏨 Donor (Hotel)</span>
            <span className="text-slate-500 text-[10px]">taj.hotel@donor.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('robinhood@ngo.com', 'Password@123')}
            className="p-2 text-left bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            <span className="font-bold text-emerald-700 block">🤝 Verified NGO</span>
            <span className="text-slate-500 text-[10px]">robinhood@ngo.com</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('volunteer.arun@ngo.com', 'Password@123')}
            className="p-2 text-left bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors"
          >
            <span className="font-bold text-amber-700 block">⏳ Pending Receiver</span>
            <span className="text-slate-500 text-[10px]">volunteer.arun@ngo.com</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
            Register as Donor or NGO
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-xs text-slate-500">Loading sign in portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
