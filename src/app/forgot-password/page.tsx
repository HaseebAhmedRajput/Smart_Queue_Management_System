'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { UnconfiguredNotice } from '../../components/UnconfiguredNotice';

export default function ForgotPasswordPage() {
  const { isConfigured, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isConfigured) {
    return <UnconfiguredNotice />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const result = await resetPassword(email);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#263445] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#172638] border border-[#24364B] flex items-center justify-center text-white shadow-md">
            <Layers className="w-7 h-7 text-[#DCE8F5]" />
          </div>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172638]">
          Reset Your Password
        </h1>
        <p className="mt-2 text-center text-sm text-[#4A5B70]">
          Enter your registered email address to receive password recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E2E8F0] sm:px-10">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#172638]">Password Reset Link Sent</h2>
              <p className="text-xs text-[#4A5B70] leading-relaxed">
                If an account with <strong>{email}</strong> exists, you will receive an email containing a link to reset your password.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#24364B] hover:bg-[#172638] transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#E11D48] mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#24364B]">
                  Account Email
                </label>
                <div className="mt-1.5 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#648BB5]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#648BB5]/30 focus:border-[#24364B] transition-all bg-white text-[#263445]"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-[#24364B] hover:bg-[#172638] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#24364B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {submitting ? (
                    <span>Sending Recovery Link...</span>
                  ) : (
                    <>
                      <span>Send Recovery Instructions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A5B70] hover:text-[#24364B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
