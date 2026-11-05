'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Clock,
  MapPin,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  ChefHat,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';

export interface DonationItem {
  id: string;
  donorId: string;
  donor: {
    id: string;
    name: string;
    organizationName?: string | null;
    organizationType?: string | null;
    phone?: string | null;
    city: string;
  };
  title: string;
  description?: string | null;
  category: string;
  quantity: number;
  quantityUnit: string;
  preparationTime?: string | null;
  pickupDeadline: string;
  foodCondition: string;
  address?: string | null;
  isAddressMasked?: boolean;
  area: string;
  city: string;
  state: string;
  pincode?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  activeClaim?: {
    id: string;
    status: string;
    expiresAt: string;
    receiverId: string;
    receiverName?: string;
    receiverOrg?: string;
    receiverPhone?: string | null;
    pickupOtp?: string;
  } | null;
}

interface DonationCardProps {
  donation: DonationItem;
  currentUserId?: string;
  currentUserRole?: string;
  onClaim?: (donationId: string) => void;
  onOpenOtpModal?: (claimId: string, title: string, knownOtp?: string) => void;
  onRefresh?: () => void;
  isClaiming?: boolean;
}

export default function DonationCard({
  donation,
  currentUserId,
  currentUserRole,
  onClaim,
  onOpenOtpModal,
  onRefresh,
  isClaiming = false,
}: DonationCardProps) {
  const isAvailable = donation.status === 'AVAILABLE';
  const isClaimed = donation.status === 'CLAIMED';
  const isCompleted = donation.status === 'COMPLETED';
  const isExpired = donation.status === 'EXPIRED';

  const isMyClaim =
    donation.activeClaim && currentUserId && donation.activeClaim.receiverId === currentUserId;

  const isMyDonation = currentUserId && donation.donorId === currentUserId;

  // Format deadline
  const deadlineDate = new Date(donation.pickupDeadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'COOKED_MEALS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BAKERY':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PRODUCE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PACKAGED_FOOD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'FRESH_HOT':
        return '🔥 Fresh & Hot';
      case 'CHILLED':
        return '❄️ Chilled / Refrigerated';
      case 'PACKAGED_SEALED':
        return '📦 Packaged & Sealed';
      case 'SHELF_STABLE':
        return '🥫 Shelf-Stable';
      default:
        return cond;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div>
        {/* Image & Badges Overlay */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {donation.imageUrl ? (
            <img
              src={donation.imageUrl}
              alt={donation.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
              <ChefHat className="w-12 h-12 stroke-[1.5]" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {isAvailable && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Available
              </span>
            )}
            {isClaimed && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
                Claimed (In Pickup)
              </span>
            )}
            {isCompleted && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-white shadow-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Rescued & Saved
              </span>
            )}
            {isExpired && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                Expired
              </span>
            )}
          </div>

          {/* Quantity Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-extrabold text-slate-800 shadow-sm border border-slate-200">
            {donation.quantity} {donation.quantityUnit}
          </div>

          {/* Category Pill */}
          <div className="absolute bottom-3 left-3">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border backdrop-blur-md shadow-sm ${getCategoryBadgeClass(
                donation.category
              )}`}
            >
              {donation.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 hover:text-emerald-700 transition-colors">
              {donation.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
              {donation.description || 'No additional preparation notes provided.'}
            </p>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            {/* Donor Info */}
            <div className="flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-slate-800">
                {donation.donor.organizationName || donation.donor.name}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                ({donation.donor.organizationType || 'Donor'})
              </span>
            </div>

            {/* Food Condition */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Condition: </span>
              <span className="font-semibold text-slate-700">{getConditionLabel(donation.foodCondition)}</span>
            </div>

            {/* Pickup Deadline */}
            <div className="flex items-center gap-1.5 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Pickup Deadline: </span>
              <span className="font-semibold text-rose-700">{formattedDeadline}</span>
            </div>

            {/* ADDRESS PRIVACY CHECK & DISPLAY */}
            <div className="pt-2">
              {donation.address ? (
                // AUTHORIZED ACCESS (Donor, Claimant, or Admin)
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exact Pickup Address (Authorized):</span>
                  </div>
                  <p className="text-slate-800 font-medium pl-5 text-[11px] leading-relaxed">
                    {donation.address}, {donation.city} - {donation.pincode}
                  </p>
                  {donation.donor.phone && (
                    <p className="text-slate-600 pl-5 text-[11px]">
                      Donor Contact: <span className="font-bold text-slate-800">{donation.donor.phone}</span>
                    </p>
                  )}
                </div>
              ) : (
                // PUBLIC / UNAUTHORIZED MASKED ADDRESS
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {donation.area}, {donation.city}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Lock className="w-2.5 h-2.5" /> Confidential
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic pl-5">
                    Exact street address is revealed to approved receivers upon verified claim.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE CLAIM 30-MINUTE TIMER & OTP SECTION */}
          {donation.activeClaim && (
            <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Active Claim Window
                </span>
                <CountdownTimer expiresAt={donation.activeClaim.expiresAt} onExpire={onRefresh} />
              </div>

              {/* Donor View: Shows the Handover OTP to tell receiver */}
              {isMyDonation && donation.activeClaim.pickupOtp && (
                <div className="p-2.5 bg-white rounded-lg border border-amber-300 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Handover Verification OTP
                  </span>
                  <span className="text-xl font-mono font-extrabold text-emerald-700 tracking-widest">
                    {donation.activeClaim.pickupOtp}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Ask receiver for pickup confirmation or give them this 6-digit code.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3">
        {isAvailable && (
          <>
            {currentUserRole === 'RECEIVER' ? (
              <button
                onClick={() => onClaim && onClaim(donation.id)}
                disabled={isClaiming}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <span>Claim Food (30m Pickup Window)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : currentUserRole === 'DONOR' ? (
              <div className="w-full text-center py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">
                Waiting for NGO Claim
              </div>
            ) : (
              <a
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors block"
              >
                Sign In as Verified NGO to Claim
              </a>
            )}
          </>
        )}

        {isClaimed && isMyClaim && (
          <button
            onClick={() =>
              onOpenOtpModal &&
              onOpenOtpModal(donation.activeClaim!.id, donation.title, donation.activeClaim?.pickupOtp)
            }
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm Pickup (Enter OTP)</span>
          </button>
        )}

        {isClaimed && isMyDonation && (
          <button
            onClick={() =>
              onOpenOtpModal &&
              onOpenOtpModal(donation.activeClaim!.id, donation.title, donation.activeClaim?.pickupOtp)
            }
            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify Handover OTP</span>
          </button>
        )}

        {isCompleted && (
          <div className="w-full py-2 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Successfully Rescued & Verified</span>
          </div>
        )}

        {isExpired && (
          <div className="w-full py-2 text-center text-xs font-medium text-rose-600 bg-rose-50 rounded-xl">
            Listing Expired
          </div>
        )}
      </div>
    </div>
  );
}
