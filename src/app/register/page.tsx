'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Users,
  Monitor,
  Info,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { UnconfiguredNotice } from '../../components/UnconfiguredNotice';

export default function RegisterPage() {
  const router = useRouter();
  const { isConfigured, signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isConfigured) {
    return <UnconfiguredNotice />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await signUp(email, password, fullName);

      if (result.error) {
        setErrorMessage(result.error);
        setSubmitting(false);
        return;
      }

      if (result.session) {
        router.push('/user');
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
      setSubmitting(false);
    }
  };

  return (
    <main className="h-screen w-full bg-[#F5F7FA] text-[#263445] flex flex-col lg:grid lg:grid-cols-[1.15fr_0.85fr] overflow-x-hidden lg:overflow-hidden">
      
      {/* ================= LEFT BRANDING SECTION (Desktop Only) ================= */}
      <section className="hidden lg:flex relative flex-col justify-between bg-[#172638] px-12 xl:px-16 py-10 text-white h-full overflow-hidden">
        {/* Background Decorative Glows */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#648BB5]/10 blur-3xl" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 shrink-0">
            <Layers className="h-6 w-6 text-[#B8D5F5]" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Smart Queue Management
            </h2>
            <p className="text-[11px] tracking-wide text-[#A9BCD1]">
              For Every Services
            </p>
          </div>
        </div>

        {/* Middle Core Content */}
        <div className="relative z-10 my-auto max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#648BB5]/30 bg-[#648BB5]/15 px-3 py-1 text-xs font-medium text-[#C9DDF4]">
            <span className="h-2 w-2 rounded-full bg-[#7DB5EA]" />
            Citizen & Family Helper
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
            Create Your Account &
            <span className="block text-[#91BCEB]">
              Skip the Long Lines.
            </span>
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#B5C4D5]">
            Register to manage family profile queue tickets, track real-time counter status, and receive automated appointment alerts.
          </p>

          {/* Access Points Tags */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#91A7BF]">
              One Platform. Multiple Access Points.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#C4D1DF]">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#91BCEB]" />
                Administration
              </span>
              <span className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[#91BCEB]" />
                Counter Operations
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#91BCEB]" />
                Citizen Services
              </span>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-[#91A7BF]">
          <span>Smart Queue Management System</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </section>

      {/* ================= RIGHT REGISTER SECTION ================= */}
      <section className="flex flex-col justify-center bg-[#F5F7FA] px-5 py-6 sm:px-10 lg:px-12 xl:px-20 h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-md my-auto">

          {/* Mobile Top Brand Header */}
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172638] text-white shadow-sm shrink-0">
              <Layers className="h-5 w-5 text-[#B8D5F5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172638] tracking-tight">
                Smart Queue Management
              </h2>
              <p className="text-[10px] text-[#648BB5] font-medium">
                Citizen Portal Registration
              </p>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-4 sm:mb-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#648BB5]">
              Get Started
            </p>

            <h2 className=" text-2xl sm:text-3xl font-bold tracking-tight text-[#172638]">
              Create Account
            </h2>

            {/* <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#718096]">
              Enter your details to register for citizen queue services.
            </p> */}
          </div>

          {/* Register Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
            <form className="space-y-3.5" onSubmit={handleSubmit}>

              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-3 text-xs text-[#9F1239]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E11D48]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Legal Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-[#24364B]">
                  Full Legal Name
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#648BB5]" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Haseeb Ahmed"
                    className="block w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-11 pr-4 text-sm text-[#263445] placeholder-[#94A3B8] transition-all focus:border-[#648BB5] focus:outline-none focus:ring-4 focus:ring-[#648BB5]/10"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#24364B]">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#648BB5]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-11 pr-4 text-sm text-[#263445] placeholder-[#94A3B8] transition-all focus:border-[#648BB5] focus:outline-none focus:ring-4 focus:ring-[#648BB5]/10"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-[#24364B]">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#648BB5]" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-11 pr-4 text-sm text-[#263445] placeholder-[#94A3B8] transition-all focus:border-[#648BB5] focus:outline-none focus:ring-4 focus:ring-[#648BB5]/10"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#24364B]">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#648BB5]" />
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pl-11 pr-4 text-sm text-[#263445] placeholder-[#94A3B8] transition-all focus:border-[#648BB5] focus:outline-none focus:ring-4 focus:ring-[#648BB5]/10"
                  />
                </div>
              </div>

              {/* Role Security Notice */}
              {/* <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#4A5B70] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#648BB5] shrink-0 mt-0.5" />
                <span>
                  Public registration assigns a <strong>Citizen</strong> role. Higher tier role permissions are assigned directly by an Administrator.
                </span>
              </div> */}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#24364B] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#172638] focus:outline-none focus:ring-4 focus:ring-[#648BB5]/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Navigation Link */}
            <div className="mt-4 border-t border-[#E2E8F0] pt-3.5 text-center">
              <p className="text-xs text-[#718096]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-bold text-[#24364B] hover:text-[#648BB5] hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Mobile Footer */}
          <p className="mt-4 text-center text-[11px] text-[#94A3B8] lg:hidden">
            © {new Date().getFullYear()} Smart Queue Management System
          </p>

        </div>
      </section>
    </main>
  );
}