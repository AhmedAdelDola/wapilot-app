// Design System - Extracted from Screenshots
// Clean, minimal, monochrome design with teal accent

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  chipActiveBg: string;
  chipActiveText: string;
  chipInactiveBg: string;
  chipInactiveText: string;
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  avatarBg: string;
  avatarText: string;
  online: string;
  busy: string;
  offline: string;
  accent: string;
  accentLight: string;
  toggleActive: string;
  toggleInactive: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  inputBg: string;
};

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  chipActiveBg: '#111827',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#F3F4F6',
  chipInactiveText: '#374151',
  tabBg: '#FFFFFF',
  tabBorder: '#E5E7EB',
  tabActive: '#111827',
  tabInactive: '#9CA3AF',
  avatarBg: '#0D9488',
  avatarText: '#FFFFFF',
  online: '#22C55E',
  busy: '#F59E0B',
  offline: '#9CA3AF',
  accent: '#3B82F6',
  accentLight: '#EFF6FF',
  toggleActive: '#3B82F6',
  toggleInactive: '#D1D5DB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  inputBg: '#F9FAFB',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#0f172a',
  border: '#334155',
  borderLight: '#1e293b',
  divider: '#334155',
  chipActiveBg: '#f8fafc',
  chipActiveText: '#0f172a',
  chipInactiveBg: '#1e293b',
  chipInactiveText: '#cbd5e1',
  tabBg: '#1e293b',
  tabBorder: '#334155',
  tabActive: '#f8fafc',
  tabInactive: '#64748b',
  avatarBg: '#0D9488',
  avatarText: '#FFFFFF',
  online: '#22C55E',
  busy: '#F59E0B',
  offline: '#64748b',
  accent: '#60A5FA',
  accentLight: '#1e3a5f',
  toggleActive: '#60A5FA',
  toggleInactive: '#475569',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#334155',
  skeletonHighlight: '#475569',
  inputBg: '#1e293b',
};

export const designSystem = {
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  typography: {
    sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
    weights: {
      regular: 'inter-normal-20',
      medium: 'inter-medium-24',
      semibold: 'inter-semibold-20',
      bold: 'inter-580-24',
    },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40 },
  radii: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, pill: 9999 },
  layout: {
    screenPaddingHorizontal: 20,
    sectionGap: 24,
    itemGap: 16,
    tabBarHeight: 80,
    headerHeight: 56,
  },
};

export type DesignSystem = typeof designSystem;
