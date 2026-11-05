'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  HeartHandshake,
  ShieldCheck,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Lock,
} from 'lucide-react';
import DonationCard, { DonationItem } from '@/components/DonationCard';
import OtpModal from '@/components/OtpModal';

interface StatsData {
  totalMealsSaved: number;
  confirmedPickupsCount: number;
  activeDonationsCount: number;
  verifiedReceiversCount: number;
  activeDonorsCount: number;
  categoryBreakdown: Record<string, number>;
  recentRescues: Array<{
    id: string;
    title: string;
    quantity: number;
    quantityUnit: string;
    category: string;
    donorName: string;
    receiverName: string;
    pickedUpAt: string;
    city: string;
  }>;
}

export default function HomePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  // OTP Modal state
  const [otpModalState, setOtpModalState] = useState<{
    isOpen: boolean;
    claimId: string;
    title: string;
    knownOtp?: string;
  }>({
    isOpen: false,
    claimId: '',
    title: '',
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    }
  };

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      let url = `/api/donations?status=ALL`;
      if (selectedCategory !== 'ALL') {
        url += `&category=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [selectedCategory, searchQuery]);

  const handleClaim = async (donationId: string) => {
    if (!user) {
      window.location.href = '/login?redirect=/receiver';
      return;
    }

    if (user.role !== 'RECEIVER') {
      alert('Only verified NGOs and volunteers can claim surplus food.');
      return;
    }

    if (user.status !== 'APPROVED') {
      alert('Your receiver account is still awaiting Admin approval.');
      return;
    }

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim donation');
      }

      alert('Donation claimed successfully! Please pick up within 30 minutes.');
      fetchDonations();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Foods' },
    { id: 'COOKED_MEALS', label: 'Cooked Meals' },
    { id: 'BAKERY', label: 'Bakery & Bread' },
    { id: 'PRODUCE', label: 'Fruits & Veg' },
    { id: 'PACKAGED_FOOD', label: 'Packaged Food' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="relative max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connecting Food Donors with Verified NGOs</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Stop Food Waste.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-green-300 bg-clip-text text-transparent">
              Feed Families in Need.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/80 leading-relaxed font-normal">
            A fast, secure full-stack logistics bridge connecting restaurants, hostels, and banquet halls with
            admin-verified NGOs. Featuring 30-minute claim reservations, confidential addresses, and OTP handover.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <Link
              href="/donor"
              className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
            >
              Post Food as Donor
            </Link>
            <Link
              href="/receiver"
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-105"
            >
              Claim Food as Verified NGO
            </Link>
          </div>

          {/* IMPACT METRICS BAR */}
          <div className="mt-12 pt-10 border-t border-emerald-800/60 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="block text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                {stats?.totalMealsSaved ?? 0}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200/80 mt-1 block">
                Confirmed Meals Saved
              </span>
              <span className="text-[10px] text-emerald-300/60">Strictly verified pickups</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="block text-3xl sm:text-4xl font-extrabold text-teal-300 font-mono">
                {stats?.confirmedPickupsCount ?? 0}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200/80 mt-1 block">
                Completed Rescues
              </span>
              <span className="text-[10px] text-emerald-300/60">OTP Handover verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="block text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono">
                {stats?.activeDonorsCount ?? 0}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200/80 mt-1 block">
                Active Donors
              </span>
              <span className="text-[10px] text-emerald-300/60">Hotels, Hostels & Kitchens</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <span className="block text-3xl sm:text-4xl font-extrabold text-green-300 font-mono">
                {stats?.verifiedReceiversCount ?? 0}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200/80 mt-1 block">
                Verified NGOs
              </span>
              <span className="text-[10px] text-emerald-300/60">Admin approved relief teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Intelligent Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            How Food Surplus Connector Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Engineered with strict security rules, address privacy, and race-condition prevention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Donor Posts Food</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Commercial kitchens list surplus meals with quantity, preparation time, food condition, and pickup deadline.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Admin Verified Claim</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Only admin-approved NGOs can claim. Atomic DB transactions guarantee only 1 active claim per donation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">30-Min Expiration Window</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Claimants have 30 minutes. If pickup is missed, the food automatically resets to Available for other NGOs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-emerald-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-4">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">OTP Handover Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Exact donor address is unlocked upon claim. Handover is finalized via 6-digit OTP to record verified meals saved.
            </p>
          </div>
        </div>
      </section>

      {/* DISCOVER SURPLUS FOOD FEED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Live Surplus Food Feed</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available donations currently awaiting claim from verified hunger relief organizations.
            </p>
          </div>

          {/* Search bar & filter pills */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid of Listings */}
        {loadingDonations ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-96 p-4 animate-pulse">
                <div className="h-44 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-100 rounded mt-auto" />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No donations match your query</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your category filters or search query to explore other food listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onClaim={handleClaim}
                onOpenOtpModal={(claimId, title, knownOtp) =>
                  setOtpModalState({ isOpen: true, claimId, title, knownOtp })
                }
                onRefresh={fetchDonations}
              />
            ))}
          </div>
        )}
      </section>

      {/* RECENT RESCUE ACTIVITY FEED */}
      {stats?.recentRescues && stats.recentRescues.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Recent Food Rescue Feed</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Real-time OTP-verified handovers</span>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.recentRescues.map((rescue) => (
                <div key={rescue.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{rescue.title}</span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Donated by {rescue.donorName}</span>
                        <span>•</span>
                        <span>Rescued by {rescue.receiverName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-extrabold text-emerald-700 text-sm block">
                      +{rescue.quantity} {rescue.quantityUnit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rescue.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModalState.isOpen}
        onClose={() => setOtpModalState({ ...otpModalState, isOpen: false })}
        claimId={otpModalState.claimId}
        donationTitle={otpModalState.title}
        knownOtp={otpModalState.knownOtp}
        userRole={user?.role}
        onSuccess={() => {
          fetchDonations();
          fetchStats();
        }}
      />
    </div>
  );
}
