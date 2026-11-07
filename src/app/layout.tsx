import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Smart Queue & Operations Management System',
  description:
    'Production-grade smart queue and operations platform with multi-role access, automatic FIFO shelf dispatch, no-show enforcement, Supabase PostgreSQL, and live analytics.',
  openGraph: {
    title: 'Smart Queue & Operations Management System',
    description:
      'Production-grade smart queue and operations platform with multi-role access, automatic FIFO shelf dispatch, no-show enforcement, Supabase PostgreSQL, and live analytics.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F5F7FA] text-[#263445] font-sans antialiased selection:bg-[#648BB5]/20 selection:text-[#24364B]">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
