'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UtensilsCrossed,
  ChefHat,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  X,
  Loader2,
  Trash2,
  Info,
} from 'lucide-react';
import DonationCard, { DonationItem } from '@/components/DonationCard';
import OtpModal from '@/components/OtpModal';
import CountdownTimer from '@/components/CountdownTimer';

export default function DonorDashboard() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CLAIMED' | 'AVAILABLE' | 'COMPLETED'>('ALL');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Post form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'COOKED_MEALS',
    quantity: 50,
    quantityUnit: 'servings',
    preparationTime: '',
    pickupDeadline: '',
    foodCondition: 'FRESH_HOT',
    address: 'Grand Palace Service Gate 2, Residency Road',
    area: 'Residency Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560025',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

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

  const fetchSessionAndDonations = async () => {
    setLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.authenticated) {
        setUser(userData.user);
      }

      // Fetch donor's own donations
      const res = await fetch('/api/donations?donorOnly=true&status=ALL');
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations);
      }
    } catch (err) {
      console.error('Error fetching donor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndDonations();

    // Default pickup deadline to 4 hours from now
    const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm
    const localIso = new Date(fourHoursLater.getTime() - fourHoursLater.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData((prev) => ({ ...prev, pickupDeadline: localIso }));
  }, []);

  const handlePostDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    setPosting(true);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to list surplus food');
      }

      setIsPostModalOpen(false);
      fetchSessionAndDonations();
    } catch (err: any) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleCancelDonation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this surplus food listing?')) return;

    try {
      const res = await fetch(`/api/donations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel listing');
      fetchSessionAndDonations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Metrics
  const activeCount = donations.filter((d) => d.status === 'AVAILABLE').length;
  const claimedCount = donations.filter((d) => d.status === 'CLAIMED').length;
  const completedCount = donations.filter((d) => d.status === 'COMPLETED').length;
  const totalMealsSaved = donations
    .filter((d) => d.status === 'COMPLETED')
    .reduce((sum, d) => sum + d.quantity, 0);

  const filteredDonations = donations.filter((d) => {
    if (activeTab === 'ALL') return true;
    return d.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
              Donor Portal
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{user?.organizationName}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Surplus Food Management</h1>
          <p className="text-xs text-slate-500">
            Post excess prepared meals, track verified NGO collections, and provide handover verification OTPs.
          </p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="py-3 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Surplus Food</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Available Listings</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">{activeCount}</span>
          <span className="text-[10px] text-slate-400">Ready for NGO claim</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Active Pickups</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">{claimedCount}</span>
          <span className="text-[10px] text-slate-400">Within 30-min window</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Completed Handowers</span>
          <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">{completedCount}</span>
          <span className="text-[10px] text-slate-400">Verified by OTP</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Your Meals Rescued</span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">{totalMealsSaved}</span>
          <span className="text-[10px] text-slate-400">Confirmed servings delivered</span>
        </div>
      </div>

      {/* ACTIVE CLAIMS / PENDING PICKUPS WITH HANDOVER OTP HIGHLIGHT */}
      {claimedCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-base">
                  Action Required: NGOs Arriving for Handover
                </h3>
                <p className="text-xs text-amber-800">
                  Provide the 6-digit verification code below to the volunteer upon physical pickup.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-xs font-bold">
              {claimedCount} Active Claim(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {donations
              .filter((d) => d.status === 'CLAIMED' && d.activeClaim)
              .map((d) => (
                <div key={d.id} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{d.title}</h4>
                      <p className="text-xs text-slate-500">
                        Claimed by:{' '}
                        <span className="font-semibold text-slate-800">
                          {d.activeClaim?.receiverOrg || d.activeClaim?.receiverName}
                        </span>
                      </p>
                    </div>
                    <CountdownTimer expiresAt={d.activeClaim!.expiresAt} onExpire={fetchSessionAndDonations} />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Handover OTP Code
                    </span>
                    <span className="text-2xl font-mono font-extrabold tracking-widest text-emerald-700">
                      {d.activeClaim?.pickupOtp || '••••••'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Receiver must present/confirm this code to finalize pickup.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setOtpModalState({
                        isOpen: true,
                        claimId: d.activeClaim!.id,
                        title: d.title,
                        knownOtp: d.activeClaim?.pickupOtp,
                      })
                    }
                    className="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Handover (Verify OTP)</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* FILTER TABS & LISTINGS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {(['ALL', 'AVAILABLE', 'CLAIMED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' && 'All Listings'}
              {tab === 'AVAILABLE' && `Available (${activeCount})`}
              {tab === 'CLAIMED' && `Claimed (${claimedCount})`}
              {tab === 'COMPLETED' && `Completed (${completedCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 border border-slate-200 p-4 animate-pulse" />
            ))}
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No donations in this category</h3>
            <p className="text-xs text-slate-500">
              Click &quot;Post Surplus Food&quot; above to list food from your commercial kitchen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map((donation) => (
              <div key={donation.id} className="relative group">
                <DonationCard
                  donation={donation}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                  onOpenOtpModal={(claimId, title, knownOtp) =>
                    setOtpModalState({ isOpen: true, claimId, title, knownOtp })
                  }
                  onRefresh={fetchSessionAndDonations}
                />
                {donation.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleCancelDonation(donation.id)}
                    className="absolute top-3 right-16 p-1.5 rounded-lg bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-sm border border-slate-200 text-[10px] flex items-center gap-1 transition-colors"
                    title="Cancel listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POST NEW FOOD DONATION MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Post Surplus Food Donation</h3>
                  <p className="text-xs text-slate-500">Connect commercial surplus directly to verified NGOs</p>
                </div>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{postError}</span>
              </div>
            )}

            <form onSubmit={handlePostDonation} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Item Title & Details
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 80 Servings Veg Biryani & Paneer Gravy"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special storage instructions, allergens, packaging details..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="COOKED_MEALS">Cooked Meals</option>
                    <option value="BAKERY">Bakery & Breads</option>
                    <option value="PRODUCE">Raw Produce / Veg</option>
                    <option value="PACKAGED_FOOD">Packaged / Dry</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="servings">Servings / Meals</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="boxes">Boxes / Crates</option>
                    <option value="packets">Packets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Food Condition</label>
                  <select
                    value={formData.foodCondition}
                    onChange={(e) => setFormData({ ...formData, foodCondition: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="FRESH_HOT">Fresh & Hot</option>
                    <option value="CHILLED">Chilled / Refrigerated</option>
                    <option value="PACKAGED_SEALED">Packaged & Sealed</option>
                    <option value="SHELF_STABLE">Shelf Stable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Deadline (Date & Time)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.pickupDeadline}
                    onChange={(e) => setFormData({ ...formData, pickupDeadline: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Pickup Location & Privacy Controls</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confidential Exact Street Address (Hidden until claimed)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Grand Palace Hotel, Loading Bay 2"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Public Neighborhood / Area (Shown in feed)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g. Residency Road / Shanthala Nagar"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="w-2/3 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Listing Surplus...</span>
                    </>
                  ) : (
                    <span>Publish Donation Listing</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModalState.isOpen}
        onClose={() => setOtpModalState({ ...otpModalState, isOpen: false })}
        claimId={otpModalState.claimId}
        donationTitle={otpModalState.title}
        knownOtp={otpModalState.knownOtp}
        userRole="DONOR"
        onSuccess={fetchSessionAndDonations}
      />
    </div>
  );
}
