// Design System - Extracted from Screenshots
// Clean, minimal, monochrome design with teal accent

export const designSystem = {
  // ─── Colors ───────────────────────────────────────────────
  colors: {
    light: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',

      textPrimary: '#0A0A0A',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      textInverse: '#FFFFFF',

      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      divider: '#E5E7EB',

      // Chips / Filters
      chipActiveBg: '#0A0A0A',
      chipActiveText: '#FFFFFF',
      chipInactiveBg: '#F3F4F6',
      chipInactiveText: '#374151',

      // Tab Bar
      tabBg: '#FFFFFF',
      tabBorder: '#E5E7EB',
      tabActive: '#0A0A0A',
      tabInactive: '#9CA3AF',

      // Avatar
      avatarBg: '#0D9488',
      avatarText: '#FFFFFF',

      // Status
      online: '#22C55E',
      busy: '#F59E0B',
      offline: '#9CA3AF',

      // Accent
      accent: '#3B82F6',
      accentLight: '#EFF6FF',

      // Toggle
      toggleActive: '#3B82F6',
      toggleInactive: '#D1D5DB',

      // Overlay
      overlay: 'rgba(0, 0, 0, 0.5)',

      // Skeleton
      skeleton: '#E5E7EB',
      skeletonHighlight: '#F3F4F6',
    },

    dark: {
      background: '#0A0A0A',
      surface: '#1C1C1E',
      surfaceElevated: '#2C2C2E',

      textPrimary: '#FFFFFF',
      textSecondary: '#9CA3AF',
      textTertiary: '#6B7280',
      textInverse: '#0A0A0A',

      border: '#2C2C2E',
      borderLight: '#1C1C1E',
      divider: '#2C2C2E',

      // Chips / Filters
      chipActiveBg: '#FFFFFF',
      chipActiveText: '#0A0A0A',
      chipInactiveBg: '#1C1C1E',
      chipInactiveText: '#D1D5DB',

      // Tab Bar
      tabBg: '#1C1C1E',
      tabBorder: '#2C2C2E',
      tabActive: '#FFFFFF',
      tabInactive: '#6B7280',

      // Avatar
      avatarBg: '#0D9488',
      avatarText: '#FFFFFF',

      // Status
      online: '#22C55E',
      busy: '#F59E0B',
      offline: '#6B7280',

      // Accent
      accent: '#60A5FA',
      accentLight: '#1E3A5F',

      // Toggle
      toggleActive: '#60A5FA',
      toggleInactive: '#4B5563',

      // Overlay
      overlay: 'rgba(0, 0, 0, 0.7)',

      // Skeleton
      skeleton: '#2C2C2E',
      skeletonHighlight: '#3C3C3E',
    },
  },

  // ─── Typography ──────────────────────────────────────────
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
    weights: {
      regular: 'inter-normal-20',
      medium: 'inter-medium-24',
      semibold: 'inter-semibold-20',
      bold: 'inter-580-24',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // ─── Spacing ─────────────────────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },

  // ─── Border Radius ───────────────────────────────────────
  radii: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    pill: 9999,
    full: 9999,
  },

  // ─── Shadows ─────────────────────────────────────────────
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  // ─── Layout ──────────────────────────────────────────────
  layout: {
    screenPaddingHorizontal: 20,
    sectionGap: 24,
    itemGap: 16,
    tabBarHeight: 80,
    headerHeight: 56,
    statusBarHeight: 44,
  },

  // ─── Animation ───────────────────────────────────────────
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
} as const;

export type DesignSystem = typeof designSystem;
export type ThemeMode = 'light' | 'dark';
export type ThemeColors = typeof designSystem.colors.light;
