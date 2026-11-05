'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  donationTitle: string;
  onSuccess: () => void;
  userRole?: string;
  knownOtp?: string; // If donor is viewing the modal, they can see the OTP to provide it
}

export default function OtpModal({
  isOpen,
  onClose,
  claimId,
  donationTitle,
  onSuccess,
  userRole = 'RECEIVER',
  knownOtp,
}: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter a complete 6-digit verification OTP');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/claims/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessMessage('Pickup confirmed successfully! Food saved recorded.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Food Handover</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{donationTitle}</p>
          </div>
        </div>

        {knownOtp && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
              Donor Handover OTP
            </span>
            <span className="text-2xl font-mono font-extrabold tracking-widest text-emerald-700">
              {knownOtp}
            </span>
            <p className="text-[11px] text-emerald-600 mt-1">
              Provide this code to the receiver when they arrive for physical pickup.
            </p>
          </div>
        )}

        {successMessage ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm font-semibold border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-300"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                {userRole === 'DONOR'
                  ? 'Verify receiver credentials by confirming the 6-digit OTP'
                  : 'Obtain this code from the donor at physical handover to confirm pickup'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 px-4 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="w-1/2 py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Complete</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
