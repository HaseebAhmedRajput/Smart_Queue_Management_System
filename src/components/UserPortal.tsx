'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
  Ban,
  Calendar,
  Building2,
  UserCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabaseService } from '@/lib/supabase/service';
import type { Applicant, Service, Floor, TokenWithDetails } from '../types/database';
import { getStatusBadge, theme, formatDuration, formatTimeAgo } from '../styles/theme';

export const UserPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const accountId = user?.id || '';

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tokens, setTokens] = useState<TokenWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New applicant modal state
  const [isAddingApplicant, setIsAddingApplicant] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNationalId, setNewNationalId] = useState('');
  const [newRelation, setNewRelation] = useState<'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other'>('self');
  const [newPhone, setNewPhone] = useState('');
  const [newDob, setNewDob] = useState('');



  const loadData = useCallback(async () => {
  if (!accountId) return;

  try {
    const [appData, svcData, flrData, tokData] = await Promise.all([
      supabaseService.getApplicants(accountId),
      supabaseService.getServices(),
      supabaseService.getFloors(),
      supabaseService.getTokensForAccount(accountId),
    ]);

    setApplicants(appData);
    setServices(svcData);
    setFloors(flrData);
    setTokens(tokData);

    setSelectedApplicantId((current) =>
      current || appData[0]?.id || ''
    );

    setSelectedServiceId((current) =>
      current || svcData[0]?.id || ''
    );
  } catch (err) {
    console.error('Failed to load user portal data:', err);
  } finally {
    setLoading(false);
  }
}, [accountId]);

useEffect(() => {
  if (!accountId) return;

  void loadData();

  const unsubscribe = supabaseService.subscribe(() => {
    void loadData();
  });

  return unsubscribe;
}, [accountId, loadData]);





  useEffect(() => {
    loadData();
    const unsubscribe = supabaseService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  const activeTokens = tokens.filter((t) => ['pending', 'called', 'working'].includes(t.status));
  const pastTokens = tokens.filter((t) => ['successful', 'rejected', 'skipped', 'cancelled'].includes(t.status));

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    setGenSuccess(null);

    if (!selectedApplicantId) {
      setGenError('Please select or add an applicant profile first.');
      return;
    }
    if (!selectedServiceId) {
      setGenError('Please select a service.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await supabaseService.generateToken({
        applicantId: selectedApplicantId,
        serviceId: selectedServiceId,
        accountId,
        isWalkIn: false,
      });

      if (res.error) {
        setGenError(res.error);
      } else if (res.data) {
        setGenSuccess(`Token ${res.data.display_number} successfully generated! It has entered the queue.`);
        await loadData();
        setTimeout(() => setGenSuccess(null), 5000);
      }
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate token');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newNationalId.trim()) {
      alert('Full Name and National ID / Passport are mandatory.');
      return;
    }

    try {
      const res = await supabaseService.createApplicant({
        account_id: accountId,
        full_name: newFullName.trim(),
        national_id_or_passport: newNationalId.trim(),
        relationship: newRelation,
        phone: newPhone.trim() || null,
        date_of_birth: newDob || null,
      });

      if (res.error) {
        alert(res.error);
      } else if (res.data) {
        setSelectedApplicantId(res.data.id);
        setIsAddingApplicant(false);
        setNewFullName('');
        setNewNationalId('');
        setNewPhone('');
        setNewDob('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add applicant');
    }
  };

  const handleDeleteApplicant = async (applicantId: string, name: string) => {
    if (confirm(`Remove applicant "${name}" from your profile list?`)) {
      const res = await supabaseService.deleteApplicant(applicantId);
      if (res.error) {
        alert(res.error);
      } else {
        await loadData();
      }
    }
  };

  const handleCancelToken = async (tokenId: string) => {
    if (confirm('Are you sure you want to cancel this pending token?')) {
      const res = await supabaseService.cancelToken(tokenId);
      if (!res.success) {
        alert(res.error || 'Failed to cancel token');
      } else {
        await loadData();
      }
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#4A5B70] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#648BB5]" />
        <span>Loading citizen portal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#263445]">
      {/* Email Verification / Status Banner */}
      <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
            <UserCheck className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#24364B]">
              Verified Citizen Account: {profile?.full_name || user?.email}
            </h4>
            <p className="text-xs text-[#718096]">
              {user?.email} • Authorized for personal and family queue management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-xs font-semibold text-[#4A5B70] flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#648BB5]" />
            <span>Refresh</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]">
            Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Generate Token Form & Applicant Selector */}
        <div className="lg:col-span-1 space-y-6">
          {/* Token Generation Card */}
          <div className={theme.card.base + ' p-6'}>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#E2E8F0]">
              <Ticket className="w-5 h-5 text-[#24364B]" />
              <h3 className="font-bold text-[#24364B] text-base">Generate Queue Token</h3>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-4">
              {/* Applicant Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#24364B]">Select Applicant</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingApplicant(true)}
                    className="text-xs text-[#2563EB] hover:text-[#1E40AF] inline-flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Profile
                  </button>
                </div>
                {applicants.length > 0 ? (
                  <select
                    value={selectedApplicantId}
                    onChange={(e) => setSelectedApplicantId(e.target.value)}
                    className={theme.input.base}
                  >
                    {applicants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name} ({a.relationship.toUpperCase()} - {a.national_id_or_passport})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#718096] text-center">
                    No applicant profiles yet.{' '}
                    <button
                      type="button"
                      onClick={() => setIsAddingApplicant(true)}
                      className="text-[#2563EB] font-bold underline cursor-pointer"
                    >
                      Add one now
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-[#718096] mt-1">
                  Separate applicant records prevent duplicate tokens and ensure compliance.
                </p>
              </div>

              {/* Service Selection */}
              <div>
                <label className="text-xs font-bold text-[#24364B] block mb-1.5">
                  Service Required
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className={theme.input.base}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} (~{s.estimated_duration_minutes}m)
                    </option>
                  ))}
                </select>
              </div>

              {genError && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECDD3] text-[#991B1B] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                  <span>{genError}</span>
                </div>
              )}

              {genSuccess && (
                <div className="p-3 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] text-[#14532D] text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#16A34A]" />
                  <span>{genSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || applicants.length === 0}
                className={theme.button.primary + ' w-full py-2.5 mt-2'}
              >
                {isSubmitting ? 'Issuing Ticket...' : 'Issue Queue Ticket'}
              </button>
            </form>
          </div>

          {/* Manage Registered Family Members */}
          <div className={theme.card.base + ' p-6'}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#24364B]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#24364B]">
                  Applicant Profiles ({applicants.length})
                </h4>
              </div>
              <button
                onClick={() => setIsAddingApplicant(true)}
                className="text-xs text-[#2563EB] hover:text-[#1E40AF] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-2.5">
              {applicants.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#24364B]">{a.full_name}</div>
                    <div className="text-[11px] text-[#718096]">
                      {a.national_id_or_passport} • <span className="uppercase font-semibold">{a.relationship}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteApplicant(a.id, a.full_name)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                    title="Remove applicant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {applicants.length === 0 && (
                <p className="text-xs text-[#718096] text-center py-2">
                  No applicants registered yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Active Tokens & Queue Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tokens Live Card */}
          <div className={theme.card.base + ' p-6'}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#16A34A] animate-ping" />
                <h3 className="font-bold text-base text-[#24364B]">Active Queue Tickets</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DCE8F5] text-[#1E3A8A] border border-[#93C5FD]">
                {activeTokens.length} in progress
              </span>
            </div>

            {activeTokens.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Ticket className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
                <h4 className="text-sm font-bold text-[#24364B]">No Active Queue Tickets</h4>
                <p className="text-xs text-[#718096] max-w-sm mx-auto mt-1">
                  You currently have no tickets in the queue. Select an applicant profile and required service to issue a token.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTokens.map((tok) => {
                  const badge = getStatusBadge(tok.status);
                  const isCalled = tok.status === 'called';
                  const isWorking = tok.status === 'working';

                  return (
                    <div
                      key={tok.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCalled
                          ? 'border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/20 shadow-md'
                          : isWorking
                          ? 'border-[#0284C7] bg-[#F0F9FF] shadow-xs'
                          : 'border-[#E2E8F0] bg-white shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#718096] tracking-wider">
                            Ticket Number
                          </span>
                          <div className="text-3xl font-black text-[#172638] tracking-tight">
                            {tok.display_number}
                          </div>
                        </div>
                        <span className={badge.className}>
                          <span className={badge.dotClassName} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E2E8F0]/80 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#718096]">Applicant:</span>
                          <span className="font-bold text-[#24364B]">
                            {tok.applicant?.full_name || 'Registered Applicant'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#718096]">Service:</span>
                          <span className="font-semibold text-[#24364B]">
                            {tok.service?.name || 'Standard Service'}
                          </span>
                        </div>

                        {tok.shelf && (
                          <div className="p-3 rounded-xl bg-white border border-[#BFDBFE] mt-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase text-[#1E3A8A]">
                                Counter Station
                              </span>
                              <span className="font-black text-sm text-[#1D4ED8]">
                                {tok.shelf.name}
                              </span>
                            </div>
                            {tok.floor && (
                              <div className="text-[11px] text-[#475569]">
                                Floor: {tok.floor.name}
                              </div>
                            )}
                          </div>
                        )}

                        {isCalled && (
                          <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] text-[11px] font-bold flex items-center gap-1.5 animate-pulse mt-2">
                            <Clock className="w-4 h-4 shrink-0 text-[#D97706]" />
                            <span>Called! Please proceed to the counter immediately.</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 text-[11px] text-[#94A3B8]">
                          <span>Issued {formatTimeAgo(tok.created_at)}</span>
                          {tok.status === 'pending' && (
                            <button
                              onClick={() => handleCancelToken(tok.id)}
                              className="text-[#E11D48] hover:text-[#9F1239] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Token History Table */}
          <div className={theme.card.base + ' p-6'}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#24364B]">Past Token History</h3>
              <span className="text-xs text-[#718096]">{pastTokens.length} records</span>
            </div>

            {pastTokens.length === 0 ? (
              <p className="text-xs text-[#718096] text-center py-6">
                No past token history recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#718096] uppercase text-[10px] tracking-wider">
                      <th className="pb-2.5 font-bold">Ticket</th>
                      <th className="pb-2.5 font-bold">Applicant</th>
                      <th className="pb-2.5 font-bold">Service</th>
                      <th className="pb-2.5 font-bold">Status</th>
                      <th className="pb-2.5 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/60">
                    {pastTokens.map((t) => {
                      const badge = getStatusBadge(t.status);
                      return (
                        <tr key={t.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 font-bold text-[#172638] font-mono">
                            {t.display_number}
                          </td>
                          <td className="py-2.5 text-[#24364B]">
                            {t.applicant?.full_name || 'Applicant'}
                          </td>
                          <td className="py-2.5 text-[#4A5B70]">
                            {t.service?.name || 'Service'}
                          </td>
                          <td className="py-2.5">
                            <span className={badge.className}>
                              <span className={badge.dotClassName} />
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-[#718096]">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Applicant Modal */}
      {isAddingApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CBD5E1] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#172638]">Add Applicant Profile</h3>
              <button
                onClick={() => setIsAddingApplicant(false)}
                className="text-[#94A3B8] hover:text-[#172638] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddApplicant} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#24364B] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Haseeb Ahmed "
                  className={theme.input.base}
                />
              </div>

              <div>
                <label className="font-bold text-[#24364B] block mb-1">National ID / Passport *</label>
                <input
                  type="text"
                  required
                  value={newNationalId}
                  onChange={(e) => setNewNationalId(e.target.value)}
                  placeholder="e.g. NID-99201923"
                  className={theme.input.base}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#24364B] block mb-1">Relationship</label>
                  <select
                    value={newRelation}
                    onChange={(e: any) => setNewRelation(e.target.value)}
                    className={theme.input.base}
                  >
                    <option value="self">Self</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#24364B] block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className={theme.input.base}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#24364B] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+92 03163----"
                  className={theme.input.base}
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingApplicant(false)}
                  className={theme.button.secondary + ' flex-1'}
                >
                  Cancel
                </button>
                <button type="submit" className={theme.button.primary + ' flex-1'}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
