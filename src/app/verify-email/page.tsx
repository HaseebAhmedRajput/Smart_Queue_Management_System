'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Layers, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[#E2E8F0] sm:px-10 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#DCE8F5] text-[#24364B] flex items-center justify-center mx-auto border border-[#648BB5]/30">
        <Mail className="w-8 h-8 text-[#24364B]" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[#172638]">Check Your Email</h2>
        <p className="text-xs text-[#4A5B70] leading-relaxed">
          {email ? (
            <>
              We have sent an activation link to <strong>{email}</strong>.
            </>
          ) : (
            'We have sent an activation link to your registered email address.'
          )}
        </p>
        <p className="text-xs text-[#718096]">
          Please click the confirmation link in the email to activate your citizen account before signing in.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/login"
          className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#24364B] hover:bg-[#172638] transition-all shadow-xs"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#263445] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#172638] border border-[#24364B] flex items-center justify-center text-white shadow-md">
            <Layers className="w-7 h-7 text-[#DCE8F5]" />
          </div>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172638]">
          Email Verification
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="text-center p-8 text-xs text-[#718096]">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>

        <div className="mt-6 text-center text-xs text-[#718096]">
          <div className="flex items-center justify-center gap-1 text-[#166534] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Secure Citizen Intake</span>
          </div>
        </div>
      </div>
    </div>
  );
}
