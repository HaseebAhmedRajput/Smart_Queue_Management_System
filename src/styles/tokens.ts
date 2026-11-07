

export const tokens = {
  colors: {
    // Cognicash Emerald Green + Soft Mint Palette
    background: {
      canvas: '#F8FAFC',
      canvasAlt: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceHover: '#ECFDF5',
      sidebar: '#FFFFFF',
      sidebarHover: '#ECFDF5',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
    },

    // Emerald Green Palette
    navy: {
      900: '#064E3B',
      800: '#065F46',
      700: '#047857',
      600: '#059669',
      500: '#10B981',
      400: '#34D399',
      300: '#6EE7B7',
      200: '#A7F3D0',
      100: '#D1FAE5',
      50: '#ECFDF5',
    },

    // Primary Accent Colors
    accent: {
      primary: '#10B981',
      blue: '#047857',
      soft: '#ECFDF5',
      hover: '#059669',
    },

    // Text Palette
    text: {
      primary: '#0F172D',
      secondary: '#475569',
      muted: '#64748B',
      light: '#FFFFFF',
      inverse: '#F8FAFC',
    },

    // Token Status Colors
    status: {
      pending: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
        badge:
          'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
        dot: 'bg-[#F59E0B]',
        label: 'Pending (In Queue)',
      },

      called: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        text: '#1D4ED8',
        badge:
          'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
        dot: 'bg-[#3B82F6] animate-ping',
        label: 'Called (At Counter)',
      },

      working: {
        bg: '#F5F3FF',
        border: '#DDD6FE',
        text: '#6D28D9',
        badge:
          'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]',
        dot: 'bg-[#8B5CF6] animate-pulse',
        label: 'Serving (In Progress)',
      },

      successful: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        text: '#047857',
        badge:
          'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
        dot: 'bg-[#10B981]',
        label: 'Completed',
      },

      rejected: {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#B91C1C',
        badge:
          'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
        dot: 'bg-[#EF4444]',
        label: 'Rejected',
      },

      skipped: {
        bg: '#FFF7ED',
        border: '#FED7AA',
        text: '#9A3412',
        badge:
          'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
        dot: 'bg-[#F97316]',
        label: 'Skipped (No-Show)',
      },

      cancelled: {
        bg: '#F8FAFC',
        border: '#E2E8F0',
        text: '#475569',
        badge:
          'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
        dot: 'bg-[#64748B]',
        label: 'Cancelled',
      },
    },

    // User Role Badges
    roles: {
      admin: {
        label: 'System Administrator',
        badge:
          'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
      },

      operation_officer: {
        label: 'Operation Officer',
        badge:
          'bg-[#D1FAE5] text-[#047857] border-[#6EE7B7]',
      },

      token_operator: {
        label: 'Token Operator (Walk-in)',
        badge:
          'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
      },

      user: {
        label: 'Applicant Account',
        badge:
          'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
      },
    },
  },

  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    card:
      '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',

    cardHover:
      '0 4px 12px 0 rgba(16, 185, 129, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',

    elevated:
      '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',

    blueGlow: '0 0 20px rgba(16, 185, 129, 0.2)',
  },
} as const;

export type TokenStatus = keyof typeof tokens.colors.status;
export type UserRole = keyof typeof tokens.colors.roles;
