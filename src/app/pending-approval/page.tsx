import React from 'react';
import Link from 'next/link';
import { Clock, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Application Under Admin Review
        </h2>

        <p className="text-xs text-slate-500 leading-relaxed">
          Your NGO/Volunteer account is currently awaiting verification by a platform administrator.
          To maintain strict food safety standards and prevent unauthorized claims, all receivers must be verified before gaining access.
        </p>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
          <div className="font-bold text-slate-800">What happens next?</div>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li>An administrator inspects your organization proof and credentials.</li>
            <li>Once approved, you will be able to discover and claim surplus food instantly.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            Return to Public Feed
          </Link>
          <Link
            href="/login"
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
