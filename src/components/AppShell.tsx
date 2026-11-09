'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  Users,
  Ticket,
  Briefcase,
  ShieldAlert,
  Tv,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { getRoleBadge } from '../styles/theme';
import { UnconfiguredNotice } from './UnconfiguredNotice';

interface Props {
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading, isConfigured, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If Supabase is not configured, show unconfigured error
  if (!isConfigured) {
    return <UnconfiguredNotice />;
  }

  // Auth pages do not show the internal operations sidebar
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/verify-email';

  useEffect(() => {
    if (!loading && !user && !isAuthPage && pathname !== '/kiosk') {
      router.replace('/login');
    }
  }, [loading, user, isAuthPage, pathname, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Overhead public kiosk page gets a streamlined layout
  if (pathname === '/kiosk') {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#263445] flex flex-col">
        <header className="bg-[#172638] text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#24364B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#24364B] border border-[#648BB5]/40 flex items-center justify-center text-white">
              <Layers className="w-4 h-4 text-[#DCE8F5]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">Smart Queue</span>
              <span className="text-[10px] text-[#A4BFDD] block -mt-0.5">Public Token Board</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => {
                  if (role === 'admin') router.push('/admin');
                  else if (role === 'operation_officer') router.push('/officer');
                  else if (role === 'token_operator') router.push('/operator');
                  else router.push('/user');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24364B] hover:bg-[#1E3249] text-white text-xs font-semibold border border-[#648BB5]/30 cursor-pointer transition-all"
              >
                <span>Back to Operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24364B] hover:bg-[#1E3249] text-white text-xs font-semibold border border-[#648BB5]/30 cursor-pointer transition-all"
              >
                <span> Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    );
  }

  // Internal Routes Authentication Check
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#172638] text-white flex items-center justify-center animate-pulse shadow-md mb-4">
          <Layers className="w-6 h-6 text-[#DCE8F5]" />
        </div>
        <p className="text-xs font-semibold text-[#4A5B70]">Checking authorization credentials...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Role Permissions Verification
  const isAuthorized = (() => {
    if (pathname.startsWith('/admin')) {
      return role === 'admin';
    }
    if (pathname.startsWith('/officer')) {
      return role === 'admin' || role === 'operation_officer';
    }
    if (pathname.startsWith('/operator')) {
      return role === 'admin' || role === 'token_operator';
    }
    if (pathname.startsWith('/user')) {
      return true; // Any verified user
    }
    return true;
  })();

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mx-auto border border-[#FECDD3]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#172638]">Access Denied</h2>
          <p className="text-xs text-[#4A5B70]">
            Your current account role (<strong>{role}</strong>) does not have permission to view this section.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (role === 'operation_officer') router.push('/officer');
                else if (role === 'token_operator') router.push('/operator');
                else router.push('/user');
              }}
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#24364B] hover:bg-[#172638] transition-all shadow-xs cursor-pointer"
            >
              <span>Go to Your Assigned Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Build role-specific navigation items
  const allNavItems = [
    {
      href: '/admin',
      label: 'Admin Panel',
      subtitle: 'Analytics & Management',
      icon: ShieldAlert,
      roles: ['admin'],
    },
    {
      href: '/officer',
      label: 'Operation Officer',
      subtitle: 'Counter Station & Actions',
      icon: Briefcase,
      roles: ['operation_officer'],
    },
    {
      href: '/operator',
      label: 'Token Operator',
      subtitle: 'Walk-in Intake',
      icon: Ticket,
      roles: ['admin', 'token_operator'],
    },
    {
      href: '/user',
      label: 'Citizen Portal',
      subtitle: 'Family Queue & History',
      icon: Users,
      roles: ['admin', 'user'],
    },
    {
      href: '/kiosk',
      label: 'Live Tokens',
      subtitle: 'Token Queue Board',
      icon: Tv,
      roles: ['admin', 'operation_officer', 'token_operator', 'user'],
    },
  ];

  const permittedNavItems = allNavItems.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  const currentRoute = permittedNavItems.find((item) => item.href === pathname);
  const roleBadge = role ? getRoleBadge(role) : null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#263445] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#172638] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#24364B] sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#24364B] border border-[#648BB5]/40 flex items-center justify-center text-white">
            <Layers className="w-4 h-4 text-[#DCE8F5]" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Smart Queue</span>
            <span className="text-[10px] text-[#A4BFDD] block -mt-0.5">Management</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-[#24364B] text-[#DCE8F5] border border-[#648BB5]/30 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Dark Midnight Navy Sidebar (#172638) - Proper Desktop Sticky Layout */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-68 bg-[#172638] border-r border-[#24364B] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Section */}
        <div>
          <div className="p-5 border-b border-[#24364B] flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#24364B] border border-[#648BB5]/40 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-5 h-5 text-[#DCE8F5]" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white">
                  Smart Queue
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#24364B] text-[#A4BFDD] border border-[#648BB5]/30">
                  Service Portal
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-[#A4BFDD] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#A4BFDD]/70 tracking-wider">
              Permitted Portals
            </div>

            {permittedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#24364B] text-white border-l-4 border-[#648BB5] shadow-xs'
                      : 'text-[#A4BFDD] hover:bg-[#1E3249] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#DCE8F5]' : 'text-[#648BB5]'
                    }`}
                  />
                  <div>
                    <div className="leading-tight">{item.label}</div>
                    <div className="text-[10px] text-[#A4BFDD]/70 font-normal leading-tight mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Real Authenticated User & Sign Out */}
        <div className="p-4 border-t border-[#24364B] space-y-3 bg-[#121E2C]">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-[#24364B] border border-[#648BB5]/40 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {profile?.full_name || 'Staff User'}
              </div>
              <div className="text-[10px] text-[#A4BFDD] truncate">
                {user.email}
              </div>
            </div>
          </div>

          {roleBadge && (
            <div className="px-1">
              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold uppercase tracking-wider ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            </div>
          )}

          <button
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#24364B] hover:bg-[#E11D48]/80 text-[#DCE8F5] hover:text-white text-xs font-semibold border border-[#648BB5]/30 cursor-pointer transition-all shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#E2E8F0] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#263445]">
                  {currentRoute?.label || 'Queue Control Center'}
                </h2>
                {roleBadge && (
                  <span className={`text-[10px] py-0.5 px-2 rounded-full font-semibold ${roleBadge.className}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#718096] hidden sm:block">
                Advanced Token Management
              </p>
            </div>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-[#24364B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-[#263445] leading-tight">
                  {profile?.full_name || user.email}
                </div>
                <div className="text-[10px] text-[#718096] leading-tight">
                  {role ? role.replace('_', ' ').toUpperCase() : 'CITIZEN'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E2E8F0] bg-white px-6 py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-[#718096]">
              © {new Date().getFullYear()} Smart Queue. All rights reserved.
            </p>

            <p className="text-xs font-medium text-[#4A5B70]">
              Smart Queue Management System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};