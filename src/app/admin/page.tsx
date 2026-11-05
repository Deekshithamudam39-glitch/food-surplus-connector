'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  UtensilsCrossed,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  PlayCircle,
  BarChart3,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
  organizationName?: string | null;
  organizationType?: string | null;
  documentUrl?: string | null;
  city?: string | null;
  createdAt: string;
  _count?: {
    donations: number;
    claims: number;
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RECEIVERS' | 'USERS' | 'DONATIONS' | 'CRON'>('RECEIVERS');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cronRunning, setCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, donRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/donations'),
        fetch('/api/stats'),
      ]);

      const usersData = await usersRes.json();
      const donData = await donRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (donData.success) setDonations(donData.donations);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunCron = async () => {
    setCronRunning(true);
    setCronMessage(null);
    try {
      const res = await fetch('/api/cron/expire-claims', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCronMessage(
          `Claim expiration job executed: ${data.expiredClaimsCount} claims expired, ${data.returnedToAvailableCount} donations returned to Available pool.`
        );
        fetchData();
      }
    } catch (err: any) {
      setCronMessage('Cron failed: ' + err.message);
    } finally {
      setCronRunning(false);
    }
  };

  const pendingReceivers = users.filter((u) => u.role === 'RECEIVER' && u.status === 'PENDING');
  const allReceivers = users.filter((u) => u.role === 'RECEIVER');

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administrator Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Oversight & Governance</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Approve NGO receivers, monitor food rescue claims, safeguard addresses, and audit the 30-minute expiration scheduler.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Pending Receivers</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">
            {pendingReceivers.length}
          </span>
          <span className="text-[10px] text-slate-400">Awaiting document approval</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Confirmed Meals Saved</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
            {stats?.totalMealsSaved ?? 0}
          </span>
          <span className="text-[10px] text-slate-400">Strictly verified pickups</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Users</span>
          <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">{users.length}</span>
          <span className="text-[10px] text-slate-400">Donors, NGOs & Admins</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Donations</span>
          <span className="text-2xl font-bold font-mono text-purple-600 mt-1 block">
            {donations.length}
          </span>
          <span className="text-[10px] text-slate-400">Systemwide listings</span>
        </div>
      </div>

      {/* TABS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('RECEIVERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'RECEIVERS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Receiver Approvals</span>
            {pendingReceivers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-mono">
                {pendingReceivers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'USERS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Users ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('DONATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DONATIONS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Donations & Claims ({donations.length})
          </button>

          <button
            onClick={() => setActiveTab('CRON')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CRON'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>30-Min Expiry Worker</span>
          </button>
        </div>

        {/* TAB 1: RECEIVER APPROVALS QUEUE */}
        {activeTab === 'RECEIVERS' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-800">
              <span className="font-bold">Admin Verification Safeguard: </span>
              Receivers cannot claim donations or access donor addresses until approved here. Verify their organization proof or volunteer credentials below.
            </div>

            {pendingReceivers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">All receivers verified</h3>
                <p className="text-xs text-slate-500">There are no pending receiver applications at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReceivers.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{rec.name}</h4>
                        <span className="text-xs font-semibold text-emerald-700">
                          {rec.organizationName || 'Individual Volunteer'} ({rec.organizationType})
                        </span>
                        <div className="text-xs text-slate-500 mt-1">{rec.email} • {rec.phone || 'No phone'}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                        Pending Approval
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div>Location: <span className="font-medium text-slate-800">{rec.city || 'Bangalore'}</span></div>
                      {rec.documentUrl && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-slate-500">Proof Document:</span>
                          <a
                            href={rec.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <span>Inspect Verification File</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'APPROVED')}
                        className="w-1/2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Receiver</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'REJECTED')}
                        className="w-1/2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                {(['ALL', 'DONOR', 'RECEIVER', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      userRoleFilter === r
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'DONOR'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-800 font-medium">
                          {u.organizationName || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{u.organizationType}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {u._count ? `${u._count.donations} listings / ${u._count.claims} claims` : '—'}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {u.status === 'APPROVED' ? (
                          <button
                            onClick={() => handleUpdateStatus(u.id, 'SUSPENDED')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEMWIDE DONATIONS & CLAIMS */}
        {activeTab === 'DONATIONS' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">All Surplus Food Donations & Claims</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Donation Title</th>
                    <th className="p-3">Donor</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Active Claim / OTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => {
                    const activeClaim = d.claims?.find((c: any) => c.status === 'PENDING_PICKUP');
                    const completedClaim = d.claims?.find((c: any) => c.status === 'COMPLETED');
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{d.title}</span>
                          <span className="text-[11px] text-slate-400">{d.category}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-800 font-medium">
                            {d.donor?.organizationName || d.donor?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{d.city}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {d.quantity} {d.quantityUnit}
                        </td>
                        <td className="p-3 text-slate-600">
                          {new Date(d.pickupDeadline).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              d.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'CLAIMED'
                                ? 'bg-amber-100 text-amber-800'
                                : d.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {activeClaim ? (
                            <div>
                              <span className="font-semibold text-amber-800 block">
                                Claimed by {activeClaim.receiver?.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                OTP: <strong className="text-emerald-700">{activeClaim.pickupOtp}</strong>
                              </span>
                            </div>
                          ) : completedClaim ? (
                            <span className="text-emerald-700 font-medium">
                              Rescued by {completedClaim.receiver?.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: 30-MIN CLAIM EXPIRY RUNNER */}
        {activeTab === 'CRON' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Claim Expiration & State Restoration Worker</h3>
                <p className="text-xs text-slate-500">Scheduled 30-minute timeout engine</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-semibold text-slate-800">Operational Logic:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>When an NGO claims food, a 30-minute pickup reservation begins.</li>
                <li>If the pickup is not verified via OTP within 30 minutes, the claim transitions to <code>EXPIRED</code>.</li>
                <li>If the original donation pickup deadline is still in the future, the donation status safely resets to <code>AVAILABLE</code> for other NGOs to claim.</li>
                <li>If the original pickup deadline has passed, the donation is marked as <code>EXPIRED</code>.</li>
              </ul>
            </div>

            {cronMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold">
                {cronMessage}
              </div>
            )}

            <button
              onClick={handleRunCron}
              disabled={cronRunning}
              className="w-full py-3 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>{cronRunning ? 'Evaluating Expired Claims...' : 'Trigger Expiration Sweep Now'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
