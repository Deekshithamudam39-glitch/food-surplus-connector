'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Building2 } from 'lucide-react';

type Ngo = {
  id: string;
  organizationName: string | null;
  organizationType: string | null;
  city: string | null;
  pincode: string | null;
  phone: string | null;
};

const typeLabels: Record<string, string> = {
  NGO: 'NGO',
  VOLUNTEER: 'Volunteer group',
  HOSTEL: 'Hostel',
  RESTAURANT: 'Restaurant',
  FUNCTION_HALL: 'Function hall',
  OTHER: 'Other',
};

// Keep only digits: "+91 98765 44441" -> "919876544441"
function cleanPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? '91' + digits : digits;
}

export default function NearbyNgosPage() {
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ngos');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong');
        } else {
          setNgos(data.ngos);
        }
      } catch {
        setError('Could not connect to the server');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/donor"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
      >
        <ArrowLeft size={16} /> Back to donor dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Nearby NGOs</h1>
      <p className="mt-2 text-sm text-slate-600">
        Have surplus food? Call an NGO in your city and tell them. They must still claim the
        food in the app, so the pickup is confirmed with the OTP.
      </p>

      {loading && <p className="mt-6 text-slate-500">Loading...</p>}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && ngos.length === 0 && (
        <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          No approved NGOs found in your city yet.
        </p>
      )}

      <div className="mt-6 grid gap-4">
        {ngos.map((ngo) => (
          <div key={ngo.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-green-700">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {ngo.organizationName || 'Unnamed organization'}
                </h2>
                <p className="text-sm text-slate-500">
                  {typeLabels[ngo.organizationType || ''] || 'Organization'} · {ngo.city}
                  {ngo.pincode ? ` - ${ngo.pincode}` : ''}
                </p>
              </div>
            </div>

            {ngo.phone && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`tel:+${cleanPhone(ngo.phone)}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <Phone size={16} /> Call {ngo.phone}
                </a>
                <a
                  href={`https://wa.me/${cleanPhone(ngo.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}