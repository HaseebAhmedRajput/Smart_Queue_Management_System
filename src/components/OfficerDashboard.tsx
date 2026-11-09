'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  PauseCircle,
  PlayCircle,
  Search,
  Building2,
  Hourglass,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabaseService } from '@/lib/supabase/service';
import type { Shelf, TokenWithDetails, TokenStatus } from '../types/database';
import { theme, getStatusBadge, formatDuration, formatTimeAgo } from '../styles/theme';

export const OfficerDashboard: React.FC = () => {
  const { user, profile } = useAuth();

  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [currentShelfId, setCurrentShelfId] = useState<string>('');
  const [allTokens, setAllTokens] = useState<TokenWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingTokenId, setRejectingTokenId] = useState<string | null>(null);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live timer tick for 120s no-show countdown and elapsed service time
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);




const loadData = useCallback(async () => {
  try {
    const assignedShelfId = profile?.assigned_shelf_id;

    if (!assignedShelfId) {
      setShelves([]);
      setAllTokens([]);
      setCurrentShelfId('');
      return;
    }

    const shData = await supabaseService.getShelves();

    const assignedShelf = shData.find(
      (s) => s.id === assignedShelfId
    );

    if (!assignedShelf) {
      setShelves([]);
      setAllTokens([]);
      setCurrentShelfId('');
      return;
    }

    const tokData = await supabaseService.getTokensForShelf(
      assignedShelf.id,
      assignedShelf.service_ids || []
    );

    setShelves([assignedShelf]);
    setAllTokens(tokData);
    setCurrentShelfId(assignedShelf.id);
  } catch (err) {
    console.error('[Officer] loadData failed:', err);
  } finally {
    setLoading(false);
  }
}, [profile?.assigned_shelf_id]);
  useEffect(() => {
    loadData();
    const unsub = supabaseService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [loadData]);

  const currentShelf = shelves.find((s) => s.id === currentShelfId) || null;

  // Tokens for this counter
  const shelfTokens = allTokens.filter((t) => t.shelf_id === currentShelf?.id);
  const currentToken = shelfTokens.find((t) => ['called', 'working'].includes(t.status));
  const completedToday = shelfTokens.filter((t) =>
    ['successful', 'rejected', 'skipped'].includes(t.status)
  );

  // Pending queue for services supported by this shelf
  const pendingQueue = allTokens.filter((t) => {
    if (t.status !== 'pending') return false;
    if (!currentShelf || !currentShelf.service_ids || currentShelf.service_ids.length === 0) return true;
    return currentShelf.service_ids.includes(t.service_id);
  });

  // Calculate elapsed time since call for 120-second no-show enforcement
  const getNoShowSecondsRemaining = (calledAt: string | null | undefined): number => {
    if (!calledAt) return 120;
    const calledTime = new Date(calledAt).getTime();
    const elapsedSec = Math.floor((currentTime - calledTime) / 1000);
    return Math.max(0, 120 - elapsedSec);
  };

  const getWorkingElapsedSeconds = (startedAt: string | null | undefined): number => {
    if (!startedAt) return 0;
    const startTime = new Date(startedAt).getTime();
    return Math.max(0, Math.floor((currentTime - startTime) / 1000));
  };

  const secondsRemaining = currentToken?.status === 'called'
    ? getNoShowSecondsRemaining(currentToken.called_at)
    : 0;

  const canSkipNoShow = currentToken?.status === 'called' && secondsRemaining <= 0;

  const handleCallNext = async () => {
    if (!currentShelf) return;
    setFeedback(null);
    const res = await supabaseService.dispatchNextToken(currentShelf.id, user?.id);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message || 'Failed to dispatch next token.' });
    } else {
      setFeedback({ type: 'success', message: res.message || 'Next token dispatched successfully.' });
      await loadData();
    }
  };

  const handleStartWork = async (tokId: string) => {
    setFeedback(null);
    const res = await supabaseService.startWork(tokId);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to start processing.' });
    } else {
      await loadData();
    }
  };

  const handleMarkSuccessful = async (tokId: string) => {
    setFeedback(null);
    const res = await supabaseService.markSuccessful(tokId);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to complete token.' });
    } else {
      setFeedback({ type: 'success', message: 'Token completed successfully.' });
      await loadData();
    }
  };

  const handleMarkSkipped = async (tokId: string) => {
    setFeedback(null);
    if (!canSkipNoShow) {
      setFeedback({
        type: 'error',
        message: `Strict No-Show enforcement: You must wait ${secondsRemaining}s before skipping.`,
      });
      return;
    }

    const res = await supabaseService.markSkipped(tokId, currentToken?.called_at || null);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to mark no-show.' });
    } else {
      setFeedback({ type: 'success', message: 'Token marked as No-Show (Skipped).' });
      await loadData();
    }
  };

  const openRejectModal = (tokId: string) => {
    setRejectingTokenId(tokId);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingTokenId) return;
    if (!rejectionReason.trim()) {
      alert('A rejection reason is mandatory.');
      return;
    }

    setFeedback(null);
    const res = await supabaseService.markRejected(rejectingTokenId, rejectionReason);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to reject token.' });
    } else {
      setFeedback({ type: 'success', message: 'Token rejected with documented reason.' });
      setRejectModalOpen(false);
      setRejectingTokenId(null);
      await loadData();
    }
  };

  const handleToggleShelfPause = async () => {
    if (!currentShelf) return;
    const res = await supabaseService.updateShelf(currentShelf.id, {
      is_paused: !currentShelf.is_paused,
    });
    if (res.error) {
      alert(res.error);
    } else {
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#4A5B70] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#648BB5]" />
        <span>Loading operation station...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#263445]">
      {/* Officer Station Top Bar */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#24364B] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6 text-[#DCE8F5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-[#172638]">
                {currentShelf ? currentShelf.name : 'Counter Station'}
              </h3>
              {currentShelf?.is_paused ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
                  Station Paused
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]">
                  Station Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#718096] mt-0.5">
              Operating Officer: <strong className="text-[#24364B]">{profile?.full_name || user?.email}</strong>
            </p>
          </div>
        </div>

        {/* Counter Station Selector & Pause Toggle */}
        {/* <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={currentShelfId}
            onChange={(e) => setCurrentShelfId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#24364B] focus:outline-none focus:ring-2 focus:ring-[#648BB5]/30 cursor-pointer"
          >
            {shelves.map((sh) => (
              <option key={sh.id} value={sh.id}>
                {sh.name} (Counter #{sh.shelf_number})
              </option>
            ))}
          </select>

          <button
            onClick={handleToggleShelfPause}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
              currentShelf?.is_paused
                ? 'bg-[#16A34A] hover:bg-[#15803D] text-white border-transparent'
                : 'bg-white hover:bg-[#F8FAFC] text-[#4A5B70] border-[#E2E8F0]'
            }`}
          >
            {currentShelf?.is_paused ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Resume Station</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4 text-[#D97706]" />
                <span>Pause Station</span>
              </>
            )}
          </button>
        </div> */}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#14532D]'
              : 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Current Active Token & Queue Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Token Workbench */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-[#24364B]" />
                <h3 className="font-extrabold text-base text-[#172638]">
                  Current Active Citizen Token
                </h3>
              </div>
              {currentToken && (
                <span className={getStatusBadge(currentToken.status).className}>
                  <span className={getStatusBadge(currentToken.status).dotClassName} />
                  {getStatusBadge(currentToken.status).label}
                </span>
              )}
            </div>

            {currentToken ? (
              <div className="mt-6 space-y-6">
                {/* Huge Token Display */}
                <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                      Processing Token
                    </span>
                    <div className="text-4xl sm:text-5xl font-black text-[#172638] tracking-tight font-mono">
                      {currentToken.display_number}
                    </div>
                    <div className="text-xs text-[#4A5B70] mt-1">
                      {currentToken.service?.name} (~{currentToken.service?.estimated_duration_minutes}m)
                    </div>
                  </div>

                  {/* 120s Timer or Service Timer */}
                  <div className="text-center sm:text-right bg-white p-4 rounded-xl border border-[#CBD5E1] shadow-2xs">
                    {currentToken.status === 'called' ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#D97706] block">
                          No-Show 
                        </span>
                        <div
                          className={`text-2xl font-black font-mono ${
                            secondsRemaining === 0 ? 'text-[#DC2626]' : 'text-[#D97706]'
                          }`}
                        >
                          {secondsRemaining > 0 ? `${secondsRemaining}s remaining` : 'Eligible for Skip'}
                        </div>
                        <span className="text-[10px] text-[#718096]">
                          Mandatory 120s countdown
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#0284C7] block">
                          Work in Progress
                        </span>
                        <div className="text-2xl font-black font-mono text-[#0284C7]">
                          {formatDuration(getWorkingElapsedSeconds(currentToken.started_at))}
                        </div>
                        <span className="text-[10px] text-[#718096]">Elapsed processing time</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Applicant Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#718096] block">Applicant</span>
                    <strong className="text-[#24364B]">{currentToken.applicant?.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#718096] block">ID / Passport</span>
                    <strong className="text-[#24364B]">{currentToken.applicant?.national_id_or_passport}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#718096] block">Intake Type</span>
                    <strong className="text-[#24364B]">
                      {currentToken.is_walk_in ? 'Walk-in Intake' : 'Portal Scheduled'}
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {currentToken.status === 'called' && (
                    <>
                      <button
                        onClick={() => handleStartWork(currentToken.id)}
                        className={theme.button.primary + ' flex-1 py-3 text-sm'}
                      >
                        <Play className="w-4 h-4 mr-2" /> Start Processing
                      </button>

                      <button
                        onClick={() => handleMarkSkipped(currentToken.id)}
                        disabled={!canSkipNoShow}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          canSkipNoShow
                            ? 'bg-[#4B5563] hover:bg-[#374151] text-white cursor-pointer shadow-xs'
                            : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed border border-[#CBD5E1]'
                        }`}
                        title={
                          canSkipNoShow
                            ? 'Mark applicant as No-Show'
                            : `120s timer active: wait ${secondsRemaining}s before skipping`
                        }
                      >
                        <Clock className="w-4 h-4" />
                        <span>No-Show Skip ({secondsRemaining > 0 ? `${secondsRemaining}s` : 'Ready'})</span>
                      </button>
                    </>
                  )}

                  {currentToken.status === 'working' && (
                    <>
                      <button
                        onClick={() => handleMarkSuccessful(currentToken.id)}
                        className={theme.button.success + ' flex-1 py-3 text-sm'}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Successful
                      </button>

                      <button
                        onClick={() => openRejectModal(currentToken.id)}
                        className={theme.button.danger + ' py-3 px-6 text-sm'}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-4">
                <Hourglass className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
                <div>
                  <h4 className="text-sm font-bold text-[#24364B]">Counter Station Idle</h4>
                  <p className="text-xs text-[#718096] max-w-sm mx-auto mt-1">
                    No token currently called. Click &quot;Call Next Eligible Token&quot; to pull the earliest FIFO ticket from the queue.
                  </p>
                </div>
                <button
                  onClick={handleCallNext}
                  disabled={currentShelf?.is_paused || pendingQueue.length === 0}
                  className={theme.button.primary + ' py-3 px-6 text-sm inline-flex items-center gap-2'}
                >
                  <Play className="w-4 h-4" />
                  <span>Call Next Eligible Token ({pendingQueue.length} waiting)</span>
                </button>
              </div>
            )}
          </div>

          {/* Recently Completed Tokens by this Counter */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#24364B]">
                Completed at Counter #{currentShelf?.shelf_number} Today
              </h3>
              <span className="text-xs font-semibold text-[#718096]">
                {completedToday.length} processed
              </span>
            </div>

            {completedToday.length === 0 ? (
              <p className="text-xs text-[#718096] text-center py-6">
                No tokens processed yet today at this counter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#718096] uppercase text-[10px]">
                      <th className="pb-2 font-bold">Ticket</th>
                      <th className="pb-2 font-bold">Applicant</th>
                      <th className="pb-2 font-bold">Status</th>
                      <th className="pb-2 font-bold">Service Time</th>
                      <th className="pb-2 font-bold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/60">
                    {completedToday.slice(0, 8).map((t) => {
                      const badge = getStatusBadge(t.status);
                      const serviceTime =
                        t.completed_at && t.started_at
                          ? Math.round(
                              (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 1000
                            )
                          : 0;

                      return (
                        <tr key={t.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 font-bold font-mono text-[#172638]">
                            {t.display_number}
                          </td>
                          <td className="py-2.5 text-[#24364B]">{t.applicant?.full_name}</td>
                          <td className="py-2.5">
                            <span className={badge.className}>
                              <span className={badge.dotClassName} />
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-[#718096]">
                            {serviceTime > 0 ? formatDuration(serviceTime) : '—'}
                          </td>
                          <td className="py-2.5 text-[#718096] truncate max-w-xs">
                            {t.rejection_reason || t.skip_reason || '—'}
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

        {/* Right Col: Eligible Pending Queue for this Counter */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h4 className="font-extrabold text-sm text-[#172638]">Waiting Token</h4>
                <p className="text-[11px] text-[#718096]">
                  {pendingQueue.length} pending for supported services
                </p>
              </div>
              <button
                onClick={handleCallNext}
                disabled={currentShelf?.is_paused || pendingQueue.length === 0 || !!currentToken}
                className={theme.button.primary + ' text-xs py-2 px-3'}
                title={currentToken ? 'Finish current token before calling next' : 'Call earliest FIFO ticket'}
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Call Next
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {pendingQueue.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E2E8F0] text-[#24364B] font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[#172638] font-mono">{t.display_number}</div>
                      <div className="text-[11px] text-[#718096]">{t.applicant?.full_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCE8F5] text-[#1E3A8A]">
                      {t.service?.code}
                    </span>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">{formatTimeAgo(t.created_at)}</div>
                  </div>
                </div>
              ))}

              {pendingQueue.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94A3B8]">
                  Queue is clear! No pending citizens waiting for this counter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#CBD5E1] space-y-4">
            <div className="flex items-center gap-2.5 text-[#E11D48] pb-3 border-b border-[#E2E8F0]">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-[#172638]">Document Rejection Reason</h3>
            </div>

            <p className="text-xs text-[#718096]">
              A formal reason is legally mandatory to record this citizen ticket as rejected in the audit trail.
            </p>

            <div>
              <label className="text-xs font-bold text-[#24364B] block mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete documentation, expired passport photos, or unverified biometric fingerprints"
                className={theme.input.base}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className={theme.button.secondary + ' flex-1'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className={theme.button.danger + ' flex-1'}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
