'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HeartHandshake,
  Clock,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Unlock,
  Lock,
  ArrowRight,
  Sparkles,
  Phone,
} from 'lucide-react';
import DonationCard, { DonationItem } from '@/components/DonationCard';
import OtpModal from '@/components/OtpModal';
import CountdownTimer from '@/components/CountdownTimer';

export default function ReceiverDashboard() {
  const [user, setUser] = useState<any>(null);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'MY_CLAIMS' | 'HISTORY'>('DISCOVER');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // OTP Modal
  const [otpModalState, setOtpModalState] = useState<{
    isOpen: boolean;
    claimId: string;
    title: string;
  }>({
    isOpen: false,
    claimId: '',
    title: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Current user
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.authenticated) {
        setUser(userData.user);
      }

      // 2. Available donations
      let url = `/api/donations?status=AVAILABLE`;
      if (selectedCategory !== 'ALL') url += `&category=${selectedCategory}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const donRes = await fetch(url);
      const donData = await donRes.json();
      if (donData.success) {
        setDonations(donData.donations);
      }

      // 3. User's claims
      const claimsRes = await fetch('/api/claims');
      const claimsData = await claimsRes.json();
      if (claimsData.success) {
        setClaims(claimsData.claims);
      }
    } catch (err) {
      console.error('Error fetching receiver data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchQuery]);

  const handleClaim = async (donationId: string) => {
    setClaimingId(donationId);
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
      setActiveTab('MY_CLAIMS');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClaimingId(null);
    }
  };

  const activeClaims = claims.filter((c) => c.status === 'PENDING_PICKUP');
  const completedClaims = claims.filter((c) => c.status === 'COMPLETED');

  const totalMealsSaved = completedClaims.reduce(
    (sum, c) => sum + (c.donation.quantity || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Verified NGO Partner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.organizationName || user?.name || 'NGO Food Rescue Hub'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
              Discover and claim nearby commercial surplus food before it spoils. Each claim reserves the food for 30 minutes.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[140px]">
            <span className="text-xs uppercase tracking-wider text-emerald-200 block font-semibold">
              Meals Rescued
            </span>
            <span className="text-3xl font-extrabold font-mono text-emerald-300 block mt-0.5">
              {totalMealsSaved}
            </span>
            <span className="text-[10px] text-emerald-200/70">Verified Handover Pickups</span>
          </div>
        </div>
      </div>

      {/* ACTIVE CLAIMS ALERT WITH 30-MINUTE TIMER & UNLOCKED ADDRESS */}
      {activeClaims.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6 animate-spin text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-base">
                  Active Pickup in Progress ({activeClaims.length})
                </h3>
                <p className="text-xs text-amber-800">
                  Exact donor addresses are unlocked. Arrive within 30 minutes and provide/confirm the OTP upon handover.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {activeClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{claim.donation.title}</h4>
                    <span className="text-xs font-semibold text-emerald-700">
                      {claim.donation.quantity} {claim.donation.quantityUnit} • {claim.donation.category}
                    </span>
                  </div>
                  <CountdownTimer expiresAt={claim.expiresAt} onExpire={fetchData} />
                </div>

                {/* UNLOCKED CONFIDENTIAL PICKUP ADDRESS */}
                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unlocked Pickup Address:</span>
                  </div>
                  <p className="text-slate-900 font-semibold pl-5 text-xs leading-relaxed">
                    {claim.donation.address || claim.donation.area}, {claim.donation.city}
                  </p>
                  {claim.donation.donor?.phone && (
                    <p className="text-slate-600 pl-5 text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Donor Phone: </span>
                      <a
                        href={`tel:${claim.donation.donor.phone}`}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        {claim.donation.donor.phone}
                      </a>
                    </p>
                  )}
                </div>

                {/* OTP Confirmation Button */}
                <button
                  onClick={() =>
                    setOtpModalState({
                      isOpen: true,
                      claimId: claim.id,
                      title: claim.donation.title,
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Handover Pickup (Enter OTP)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DASHBOARD TABS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('DISCOVER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DISCOVER'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Discover Surplus Food ({donations.length})
          </button>

          <button
            onClick={() => setActiveTab('MY_CLAIMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MY_CLAIMS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Active Claims ({activeClaims.length})
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pickup History ({completedClaims.length})
          </button>
        </div>

        {/* TAB 1: DISCOVER SURPLUS FOOD */}
        {activeTab === 'DISCOVER' && (
          <div className="space-y-6">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'ALL', label: 'All Items' },
                  { id: 'COOKED_MEALS', label: 'Cooked Meals' },
                  { id: 'BAKERY', label: 'Bakery' },
                  { id: 'PRODUCE', label: 'Produce' },
                  { id: 'PACKAGED_FOOD', label: 'Packaged' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
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

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-80 border border-slate-200 p-4 animate-pulse" />
                ))}
              </div>
            ) : donations.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No food currently available</h3>
                <p className="text-xs text-slate-500">
                  Check back soon! Commercial donors post surplus whenever buffets, meals, or bakery batches conclude.
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
                    isClaiming={claimingId === donation.id}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ACTIVE CLAIMS */}
        {activeTab === 'MY_CLAIMS' && (
          <div className="space-y-4">
            {activeClaims.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No active claims right now</h3>
                <p className="text-xs text-slate-500">
                  Switch to the &quot;Discover Surplus Food&quot; tab to claim available items for distribution.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeClaims.map((claim) => (
                  <div key={claim.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{claim.donation.title}</h4>
                        <span className="text-xs text-emerald-700 font-semibold">
                          {claim.donation.quantity} {claim.donation.quantityUnit}
                        </span>
                      </div>
                      <CountdownTimer expiresAt={claim.expiresAt} onExpire={fetchData} />
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Pickup Location (Unlocked):</span>
                      </div>
                      <p className="text-slate-900 pl-5 font-semibold">
                        {claim.donation.address || claim.donation.area}, {claim.donation.city}
                      </p>
                      {claim.donation.donor?.phone && (
                        <p className="text-slate-600 pl-5">
                          Donor Contact: <span className="font-bold">{claim.donation.donor.phone}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setOtpModalState({
                          isOpen: true,
                          claimId: claim.id,
                          title: claim.donation.title,
                        })
                      }
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Handover (Enter OTP)</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RESCUE HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Verified Rescues & Pickups</h3>
                <p className="text-xs text-slate-500">
                  Only pickups confirmed with 6-digit handover OTPs appear here and in platform statistics.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                {totalMealsSaved} Meals Rescued
              </span>
            </div>

            {completedClaims.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No completed pickups recorded yet. Claim available food and complete the OTP verification.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {completedClaims.map((claim) => (
                  <div key={claim.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{claim.donation.title}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Donated by {claim.donation.donor?.organizationName || 'Donor'}</span>
                          <span>•</span>
                          <span>{claim.donation.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-extrabold text-emerald-700 text-sm block">
                        +{claim.donation.quantity} {claim.donation.quantityUnit}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {claim.pickedUpAt ? new Date(claim.pickedUpAt).toLocaleDateString() : 'Verified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModalState.isOpen}
        onClose={() => setOtpModalState({ ...otpModalState, isOpen: false })}
        claimId={otpModalState.claimId}
        donationTitle={otpModalState.title}
        userRole="RECEIVER"
        onSuccess={() => {
          fetchData();
          setActiveTab('HISTORY');
        }}
      />
    </div>
  );
}
