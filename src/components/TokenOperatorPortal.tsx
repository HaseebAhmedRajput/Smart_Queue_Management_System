'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Printer,
  Ticket,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  UserPlus,
  Clock,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabaseService } from '../lib/supabase/service';
import type { Service, Floor, TokenWithDetails, Applicant } from '../types/database';
import { theme, getStatusBadge, formatTimeAgo } from '../styles/theme';

export const TokenOperatorPortal: React.FC = () => {
  const { user, profile } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [recentTokens, setRecentTokens] = useState<TokenWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for walk-in
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [activeVoucher, setActiveVoucher] = useState<TokenWithDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [svcData, flrData, tokData] = await Promise.all([
        supabaseService.getServices(),
        supabaseService.getFloors(),
        supabaseService.getAllTokensDetailed(),
      ]);

      setServices(svcData);
      setFloors(flrData);
      setRecentTokens(tokData.filter((t) => t.is_walk_in).slice(0, 15));

      if (svcData.length > 0 && !selectedServiceId) {
        setSelectedServiceId(svcData[0].id);
      }
    } catch (err) {
      console.error('Error loading token operator data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    loadData();
    const unsub = supabaseService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [loadData]);

  const handleGenerateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !nationalId.trim()) {
      setErrorMsg('Visitor full name and National ID / Passport are mandatory.');
      return;
    }
    if (!selectedServiceId) {
      setErrorMsg('Please select a required service.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create applicant profile for this walk-in citizen
      const appRes = await supabaseService.createApplicant({
        account_id: user?.id || '',
        full_name: fullName.trim(),
        national_id_or_passport: nationalId.trim(),
        relationship: 'other',
        phone: phone.trim() || null,
      });

      if (appRes.error || !appRes.data) {
        setErrorMsg(appRes.error || 'Failed to register visitor profile.');
        setIsSubmitting(false);
        return;
      }

      // 2. Generate Token
      const tokRes = await supabaseService.generateToken({
        accountId: user?.id || '',
        applicantId: appRes.data.id,
        serviceId: selectedServiceId,
        isWalkIn: true,
      });

      if (tokRes.error || !tokRes.data) {
        setErrorMsg(tokRes.error || 'Failed to issue token.');
        setIsSubmitting(false);
        return;
      }

      // 3. Display voucher
      const selectedSvc = services.find((s) => s.id === selectedServiceId);
      setActiveVoucher({
        ...tokRes.data,
        applicant: appRes.data,
        service: selectedSvc,
      });

      // Clear input fields
      setFullName('');
      setNationalId('');
      setPhone('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#4A5B70] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#648BB5]" />
        <span>Loading token operator desk...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#263445]">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#24364B] text-white flex items-center justify-center shadow-xs">
            <Ticket className="w-6 h-6 text-[#DCE8F5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#172638]">
              Walk-in Visitor Intake & Token Issuance
            </h3>
            <p className="text-xs text-[#718096]">
              Operator: <strong className="text-[#24364B]">{profile?.full_name || user?.email}</strong> • Physical reception desk
            </p>
          </div>
        </div>
        <button
          onClick={() => loadData()}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-xs font-semibold text-[#4A5B70] flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#648BB5]" />
          <span>Refresh Desk</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Intake Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className={theme.card.base + ' p-6'}>
            <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#E2E8F0]">
              <UserPlus className="w-5 h-5 text-[#24364B]" />
              <h4 className="font-bold text-base text-[#172638]">Issue Walk-in Ticket</h4>
            </div>

            <form onSubmit={handleGenerateWalkIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#24364B] block mb-1">
                  Visitor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Anas KK"
                  className={theme.input.base}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#24364B] block mb-1">
                  National ID / Passport Number *
                </label>
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. NID-41304212"
                  className={theme.input.base}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#24364B] block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 03163----"
                  className={theme.input.base}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#24364B] block mb-1">
                  Service Requested *
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

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={theme.button.primary + ' w-full py-3 mt-2 font-bold'}
              >
                {isSubmitting ? (
                  <span>Printing Ticket...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" />
                    <span>Print & Dispatch Token</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Active Voucher Slip & Recent Walk-ins */}
        <div className="lg:col-span-2 space-y-6">
          {/* Printable Ticket Voucher Card */}
          {activeVoucher ? (
            <div className="p-6 rounded-2xl bg-white border-2 border-[#24364B] shadow-md space-y-6">
              <div className="flex items-start justify-between border-b border-dashed border-[#CBD5E1] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#648BB5]">
                    Official Intake Voucher
                  </span>
                  <h3 className="text-2xl font-black text-[#172638] tracking-tight">
                    Smart Queue & Operations
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Walk-in Ticket Issued: {new Date(activeVoucher.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-[#24364B] hover:bg-[#172638] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>

              <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] text-center space-y-2">
                <span className="text-xs uppercase font-extrabold text-[#718096] tracking-wider">
                  Ticket Number
                </span>
                <div className="text-5xl font-black text-[#172638] font-mono tracking-tight">
                  {activeVoucher.display_number}
                </div>
                <div className="text-sm font-bold text-[#24364B]">
                  {activeVoucher.service?.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#718096] uppercase block">
                    Citizen Name
                  </span>
                  <strong className="text-sm text-[#24364B]">
                    {activeVoucher.applicant?.full_name}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#718096] uppercase block">
                    Identification
                  </span>
                  <strong className="text-sm text-[#24364B]">
                    {activeVoucher.applicant?.national_id_or_passport}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E3A8A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>
                  Please watch the overhead TV kiosk displays. When your ticket is called, you will have 120 seconds to report to the counter.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center space-y-3">
              <Ticket className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
              <h4 className="font-bold text-sm text-[#24364B]">No Active Voucher Slip</h4>
              <p className="text-xs text-[#718096] max-w-sm mx-auto">
                Fill in the visitor details on the left and click &quot;Print & Dispatch Token&quot; to issue a ticket voucher.
              </p>
            </div>
          )}

          {/* Today's Walk-in History */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#24364B]">Today&apos;s Issued Walk-in Tickets</h4>
              <span className="text-xs text-[#718096] font-semibold">
                {recentTokens.length} tickets
              </span>
            </div>

            {recentTokens.length === 0 ? (
              <p className="text-xs text-[#718096] text-center py-6">
                No walk-in tokens issued today.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#718096] uppercase text-[10px]">
                      <th className="pb-2 font-bold">Ticket</th>
                      <th className="pb-2 font-bold">Visitor</th>
                      <th className="pb-2 font-bold">Service</th>
                      <th className="pb-2 font-bold">Status</th>
                      <th className="pb-2 font-bold">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/60">
                    {recentTokens.map((t) => {
                      const badge = getStatusBadge(t.status);
                      return (
                        <tr key={t.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 font-bold font-mono text-[#172638]">
                            {t.display_number}
                          </td>
                          <td className="py-2.5 text-[#24364B] font-medium">
                            {t.applicant?.full_name}
                          </td>
                          <td className="py-2.5 text-[#4A5B70]">
                            {t.service?.name}
                          </td>
                          <td className="py-2.5">
                            <span className={badge.className}>
                              <span className={badge.dotClassName} />
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-[#718096]">
                            {formatTimeAgo(t.created_at)}
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
    </div>
  );
};
