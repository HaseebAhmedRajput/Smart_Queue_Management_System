import React from 'react';
import { Database, AlertTriangle, Key, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

export const UnconfiguredNotice: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#263445] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white border border-[#CBD5E1] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-md space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-[#E2E8F0]">
          <div className="p-3.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] shrink-0">
            <AlertTriangle className="w-7 h-7 text-[#D97706]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#172638]">Supabase Configuration Required</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]">
                Setup Pending
              </span>
            </div>
            <p className="text-xs text-[#718096] mt-1">
              This production-grade system enforces real PostgreSQL, Row Level Security, and Supabase Auth.
              To start using the app, configure your Supabase project credentials in your environment.
            </p>
          </div>
        </div>

        {/* Required Steps */}
        <div className="space-y-4 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#24364B]">
            Required Setup Steps
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-[#24364B] font-bold">
                <span className="w-5 h-5 rounded-full bg-[#24364B] text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Configure Environment Variables</span>
              </div>
              <p className="text-[#4A5B70]">
                Add your Supabase project credentials to <code className="bg-[#E2E8F0] px-1.5 py-0.5 rounded text-[#24364B] font-mono font-semibold">.env.local</code>:
              </p>
              <pre className="p-3 rounded-lg bg-[#172638] text-[#DCE8F5] font-mono text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-[#24364B] font-bold">
                <span className="w-5 h-5 rounded-full bg-[#24364B] text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Execute PostgreSQL Migrations</span>
              </div>
              <p className="text-[#4A5B70]">
                Open your Supabase project's SQL Editor and run the migration file to establish tables, triggers, and Row Level Security:
              </p>
              <div className="font-mono text-[11px] bg-[#E2E8F0] p-2 rounded text-[#24364B]">
                supabase/migrations/0001_queue_system.sql
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-[#24364B] font-bold">
                <span className="w-5 h-5 rounded-full bg-[#24364B] text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Seed Operating Data & Services</span>
              </div>
              <p className="text-[#4A5B70]">
                In the Supabase SQL Editor, run the seed file to populate floors, service counters, and services:
              </p>
              <div className="font-mono text-[11px] bg-[#E2E8F0] p-2 rounded text-[#24364B]">
                supabase/seed.sql
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-[#24364B] font-bold">
                <span className="w-5 h-5 rounded-full bg-[#24364B] text-white flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>Bootstrap Initial Admin Account</span>
              </div>
              <p className="text-[#4A5B70]">
                Once registered via the web application, promote your account to System Administrator using:
              </p>
              <div className="font-mono text-[11px] bg-[#E2E8F0] p-2 rounded text-[#24364B]">
                supabase/promote_admin.sql
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718096]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Real Database & Authentication Security Active</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[#24364B] hover:bg-[#172638] text-white font-bold cursor-pointer transition-all shadow-xs"
          >
            Check Configuration & Reload
          </button>
        </div>
      </div>
    </div>
  );
};
