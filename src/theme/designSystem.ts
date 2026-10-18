// Design System - Message Pro Brand Colors

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
  // Brand specific
  brandPrimary: string;
  brandPrimarySelected: string;
  brandGradientStart: string;
  brandGradientEnd: string;
  placeholderText: string;
  disabledText: string;
  success: string;
  successBg: string;
  error: string;
  warning: string;
  warningBg: string;
  hoverBg: string;
  sidebarBg: string;
  lightGraySurface: string;
  strongBorder: string;
};

const lightColors: ThemeColors = {
  // Light Mode
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  sidebarBg: '#FAFAFA',
  lightGraySurface: '#F0F2F5',
  textPrimary: '#0D0D0D',
  textSecondary: '#5C6470',
  textTertiary: '#80838D',
  textInverse: '#FAFAFA',
  placeholderText: '#80838D',
  disabledText: '#8B8D98',
  border: '#EAEAEA',
  borderLight: '#ECECEC',
  strongBorder: '#E2E3E7',
  divider: '#EAEAEA',
  chipActiveBg: '#4162E3',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#F0F2F5',
  chipInactiveText: '#5C6470',
  tabBg: '#FAFAFA',
  tabBorder: '#EAEAEA',
  tabActive: '#4162E3',
  tabInactive: '#80838D',
  avatarBg: '#4162E3',
  avatarText: '#FFFFFF',
  online: '#2CA54A',
  busy: '#FA8900',
  offline: '#8B8D98',
  accent: '#4162E3',
  accentLight: 'rgba(65, 98, 227, 0.10)',
  toggleActive: '#4162E3',
  toggleInactive: '#EAEAEA',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#EAEAEA',
  skeletonHighlight: '#F0F2F5',
  inputBg: 'rgba(0, 0, 0, 0.03)',
  hoverBg: 'rgba(196, 197, 198, 0.22)',
  // Brand specific
  brandPrimary: '#4162E3',
  brandPrimarySelected: 'rgba(65, 98, 227, 0.10)',
  brandGradientStart: '#4162E3',
  brandGradientEnd: '#1B21A8',
  success: '#2CA54A',
  successBg: '#DBF5E1',
  error: '#FF382E',
  warning: '#FA8900',
  warningBg: '#FFEBD1',
};

const darkColors: ThemeColors = {
  // Dark Mode
  background: '#0D0D0D',
  surface: '#161616',
  surfaceElevated: '#1C1C1E',
  sidebarBg: '#141414',
  lightGraySurface: '#161616',
  textPrimary: '#FAFAFA',
  textSecondary: '#B0B4BA',
  textTertiary: '#80838D',
  textInverse: '#0D0D0D',
  placeholderText: '#80838D',
  disabledText: '#8B8D98',
  border: '#212121',
  borderLight: '#181818',
  strongBorder: '#2C2C2C',
  divider: '#212121',
  chipActiveBg: '#4162E3',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#161616',
  chipInactiveText: '#B0B4BA',
  tabBg: '#0D0D0D',
  tabBorder: '#212121',
  tabActive: '#4162E3',
  tabInactive: '#80838D',
  avatarBg: '#4162E3',
  avatarText: '#FFFFFF',
  online: '#2CA54A',
  busy: '#FA8900',
  offline: '#80838D',
  accent: '#4162E3',
  accentLight: 'rgba(65, 98, 227, 0.15)',
  toggleActive: '#4162E3',
  toggleInactive: '#2C2C2C',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#212121',
  skeletonHighlight: '#2C2C2C',
  inputBg: '#161616',
  hoverBg: 'rgba(147, 153, 176, 0.12)',
  // Brand specific
  brandPrimary: '#4162E3',
  brandPrimarySelected: 'rgba(65, 98, 227, 0.12)',
  brandGradientStart: '#4162E3',
  brandGradientEnd: '#1B21A8',
  success: '#2CA54A',
  successBg: 'rgba(44, 165, 74, 0.15)',
  error: '#FF382E',
  warning: '#FA8900',
  warningBg: 'rgba(250, 137, 0, 0.15)',
};

export const designSystem = {
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  typography: {
    sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
    weights: {
      regular: 'Gontserrat-Regular',
      medium: 'Gontserrat-Regular',
      semibold: 'Gontserrat-Bold',
      bold: 'Gontserrat-Bold',
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
