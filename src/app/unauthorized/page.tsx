import React from 'react';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Access Restricted (403)
        </h2>

        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have the required permissions to view this portal. Server-side role authorization prevents unauthorized cross-role access.
        </p>

        <div className="pt-4 flex flex-col gap-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/login"
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
