// import { tokens, type TokenStatus, type UserRole } from './tokens';

// export const theme = {
//   layout: {
//     container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
//     pageHeader: 'mb-8 space-y-1',
//   },
//   card: {
//     base: 'bg-white border border-[#E2E8F0] rounded-xl shadow-xs backdrop-blur-sm transition-all',
//     hover: 'hover:border-[#CBD5E1] hover:shadow-sm',
//     interactive: 'cursor-pointer active:scale-[0.99] transition-transform',
//     elevated: 'bg-white border border-[#E2E8F0] rounded-xl shadow-md',
//     alt: 'bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl',
//   },
//   button: {
//     primary:
//       'inline-flex items-center justify-center font-semibold px-4 py-2 rounded-lg bg-[#24364B] hover:bg-[#172638] active:bg-[#0F1A26] text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
//     secondary:
//       'inline-flex items-center justify-center font-medium px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#263445] border border-[#E2E8F0] shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
//     accent:
//       'inline-flex items-center justify-center font-semibold px-4 py-2 rounded-lg bg-[#648BB5] hover:bg-[#4F759E] active:bg-[#3D6288] text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
//     success:
//       'inline-flex items-center justify-center font-semibold px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
//     danger:
//       'inline-flex items-center justify-center font-semibold px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
//     warning:
//       'inline-flex items-center justify-center font-semibold px-4 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
//     ghost:
//       'inline-flex items-center justify-center font-medium px-3 py-1.5 rounded-lg text-[#4A5B70] hover:text-[#263445] hover:bg-[#DCE8F5]/40 transition-all cursor-pointer',
//   },
//   input: {
//     base: 'w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[#263445] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#648BB5]/25 focus:border-[#24364B] transition-all',
//     error: 'border-[#E11D48] focus:ring-[#E11D48]/25 focus:border-[#E11D48]',
//   },
// };

// export function getStatusBadge(status: TokenStatus) {
//   const config = tokens.colors.status[status] || tokens.colors.status.pending;
//   return {
//     className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`,
//     dotClassName: `w-1.5 h-1.5 rounded-full ${config.dot}`,
//     label: config.label,
//   };
// }

// export function getRoleBadge(role: UserRole) {
//   const config = tokens.colors.roles[role] || tokens.colors.roles.user;
//   return {
//     className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge}`,
//     label: config.label,
//   };
// }

// export function formatDuration(seconds: number): string {
//   if (isNaN(seconds) || seconds < 0) return '0m 0s';
//   const mins = Math.floor(seconds / 60);
//   const secs = Math.floor(seconds % 60);
//   if (mins === 0) return `${secs}s`;
//   return `${mins}m ${secs}s`;
// }

// export function formatTimeAgo(isoString: string): string {
//   try {
//     const diffMs = Date.now() - new Date(isoString).getTime();
//     const diffSec = Math.floor(diffMs / 1000);
//     if (diffSec < 60) return `${diffSec}s ago`;
//     const diffMin = Math.floor(diffSec / 60);
//     if (diffMin < 60) return `${diffMin}m ago`;
//     const diffHr = Math.floor(diffMin / 60);
//     return `${diffHr}h ago`;
//   } catch {
//     return 'just now';
//   }
// }



import { tokens, type TokenStatus, type UserRole } from './tokens';

export const COLORS = {
  primary: '#10B981',
  primaryLight: '#ECFDF5',
  primaryDark: '#047857',
  primaryMuted: '#A7F3D0',

  white: '#FFFFFF',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  text: '#0F172D',
  subtext: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  info: '#3B82F6',
  infoLight: '#DBEAFE',

  chartColors: [
    '#10B981',
    '#3B82F6',
    '#F59E0B',
    '#EC4899',
    '#8B5CF6',
    '#06B6D4',
    '#F97316',
    '#84CC16',
  ],
} as const;

export const theme = {
  colors: COLORS,

  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    pageHeader: 'mb-8 space-y-1',
  },

  card: {
    base: 'bg-white border border-[#E2E8F0] rounded-xl shadow-xs transition-all duration-200',
    hover: 'hover:border-[#A7F3D0] hover:shadow-sm',
    interactive:
      'cursor-pointer active:scale-[0.99] transition-transform duration-150',
    elevated: 'bg-white border border-[#E2E8F0] rounded-xl shadow-md',
    alt: 'bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl',
  },

  button: {
    primary:
      'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',

    secondary:
      'inline-flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#0F172D] border border-[#E2E8F0] shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',

    accent:
      'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] active:bg-[#064E3B] text-white shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',

    success:
      'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',

    danger:
      'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] text-white shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',

    warning:
      'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',

    ghost:
      'inline-flex items-center justify-center gap-2 font-medium px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#047857] hover:bg-[#ECFDF5] transition-all duration-200 cursor-pointer',
  },

  input: {
    base:
      'w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172D] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/25 focus:border-[#10B981] transition-all duration-200',

    error:
      'border-[#EF4444] focus:ring-[#EF4444]/25 focus:border-[#EF4444]',
  },

  badge: {
    primary:
      'inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-xs font-semibold text-[#047857]',

    success:
      'inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-xs font-semibold text-[#047857]',

    warning:
      'inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#92400E]',

    danger:
      'inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEE2E2] px-2.5 py-1 text-xs font-semibold text-[#B91C1C]',

    info:
      'inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]',

    neutral:
      'inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#64748B]',
  },

  sidebar: {
    base: 'bg-white border-r border-[#E2E8F0]',
    item:
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#047857]',
    active:
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]',
  },

  table: {
    wrapper: 'overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white',
    header: 'bg-[#F8FAFC] text-[#64748B] text-xs font-semibold uppercase tracking-wide',
    row: 'border-t border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]',
    cell: 'px-4 py-3 text-sm text-[#0F172D]',
  },
};

export function getStatusBadge(status: TokenStatus) {
  const config =
    tokens.colors.status[status] || tokens.colors.status.pending;

  return {
    className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`,
    dotClassName: `w-1.5 h-1.5 rounded-full ${config.dot}`,
    label: config.label,
  };
}

export function getRoleBadge(role: UserRole) {
  const config =
    tokens.colors.roles[role] || tokens.colors.roles.user;

  return {
    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge}`,
    label: config.label,
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0m 0s';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${secs}s`;
}

export function formatTimeAgo(isoString: string): string {
  try {
    const timestamp = new Date(isoString).getTime();

    if (!Number.isFinite(timestamp)) {
      return 'just now';
    }

    const diffSec = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 1000)
    );

    if (diffSec < 60) {
      return `${diffSec}s ago`;
    }

    const diffMin = Math.floor(diffSec / 60);

    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }

    const diffHr = Math.floor(diffMin / 60);

    if (diffHr < 24) {
      return `${diffHr}h ago`;
    }

    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'just now';
  }
}


