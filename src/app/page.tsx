'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { UnconfiguredNotice } from '../components/UnconfiguredNotice';
import LoginPage from './login/page';
import { Layers } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, role, loading, isConfigured } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      switch (role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'operation_officer':
          router.replace('/officer');
          break;
        case 'token_operator':
          router.replace('/operator');
          break;
        case 'user':
        default:
          router.replace('/user');
          break;
      }
    }
  }, [user, role, loading, router]);

  if (!isConfigured) {
    return <UnconfiguredNotice />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#172638] text-white flex items-center justify-center animate-pulse shadow-md mb-4">
          <Layers className="w-6 h-6 text-[#DCE8F5]" />
        </div>
        <p className="text-xs font-semibold text-[#4A5B70]">Loading Smart Queue System...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-[#172638] text-white flex items-center justify-center animate-pulse shadow-md mb-4">
        <Layers className="w-6 h-6 text-[#DCE8F5]" />
      </div>
      <p className="text-xs font-semibold text-[#4A5B70]">Redirecting to your authorized dashboard...</p>
    </div>
  );
}
