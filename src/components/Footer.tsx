import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Heart, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-bold text-lg text-white">Food Surplus Connector</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bridging the gap between food abundance and hunger. Connecting commercial kitchens, hostels, and banquets directly with verified NGOs to eliminate food waste.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Roles</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  Commercial Donors (Hotels & Hostels)
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  Verified NGOs & Food Banks
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Admin Verification Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Safety & Protocols</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Verified Receivers Only</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidential Donor Addresses</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>6-Digit Handover OTP Verification</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Key Rules</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Claims reserve food for 30 minutes. If uncollected, donations safely return to the available pool.
            </p>
            <div className="text-[11px] text-emerald-400 font-medium">
              Only physically confirmed pickups count toward Meals Saved statistics.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Food Surplus Connector Platform. Open source & social impact initiative.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-400">
              Built with Next.js, Prisma, SQLite & Tailwind CSS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
