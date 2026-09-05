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
  background: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  sidebarBg: '#FEFEFE',
  lightGraySurface: '#F0F0F3',
  textPrimary: '#282E34',
  textSecondary: '#626F7F',
  textTertiary: '#80838D',
  textInverse: '#FFFFFF',
  placeholderText: '#80838D',
  disabledText: '#8B8D98',
  border: '#EAEAEA',
  borderLight: '#ECECEC',
  strongBorder: '#E2E3E7',
  divider: '#EAEAEA',
  chipActiveBg: '#725AFF',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#F0F0F3',
  chipInactiveText: '#626F7F',
  tabBg: '#FFFFFF',
  tabBorder: '#EAEAEA',
  tabActive: '#725AFF',
  tabInactive: '#80838D',
  avatarBg: '#725AFF',
  avatarText: '#FFFFFF',
  online: '#2CA54A',
  busy: '#FA8900',
  offline: '#8B8D98',
  accent: '#725AFF',
  accentLight: 'rgba(114, 90, 255, 0.10)',
  toggleActive: '#725AFF',
  toggleInactive: '#EAEAEA',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#EAEAEA',
  skeletonHighlight: '#F0F0F3',
  inputBg: 'rgba(0, 0, 0, 0.03)',
  hoverBg: 'rgba(196, 197, 198, 0.22)',
  // Brand specific
  brandPrimary: '#725AFF',
  brandPrimarySelected: 'rgba(114, 90, 255, 0.10)',
  brandGradientStart: '#E600FF',
  brandGradientEnd: '#002DC8',
  success: '#2CA54A',
  successBg: '#DBF5E1',
  error: '#FF382E',
  warning: '#FA8900',
  warningBg: '#FFEBD1',
};

const darkColors: ThemeColors = {
  // Dark Mode
  background: '#101113',
  surface: '#1B1C20',
  surfaceElevated: '#1A1C20',
  sidebarBg: '#222225',
  lightGraySurface: '#1B1C20',
  textPrimary: '#EDEEF0',
  textSecondary: '#B0B4BA',
  textTertiary: '#80838D',
  textInverse: '#101113',
  placeholderText: '#80838D',
  disabledText: '#8B8D98',
  border: '#24262B',
  borderLight: '#1B1C20',
  strongBorder: '#31343A',
  divider: '#24262B',
  chipActiveBg: '#725AFF',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#1B1C20',
  chipInactiveText: '#B0B4BA',
  tabBg: '#222225',
  tabBorder: '#24262B',
  tabActive: '#725AFF',
  tabInactive: '#80838D',
  avatarBg: '#725AFF',
  avatarText: '#FFFFFF',
  online: '#2CA54A',
  busy: '#FA8900',
  offline: '#80838D',
  accent: '#725AFF',
  accentLight: 'rgba(114, 90, 255, 0.15)',
  toggleActive: '#725AFF',
  toggleInactive: '#31343A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#24262B',
  skeletonHighlight: '#31343A',
  inputBg: '#1B1C20',
  hoverBg: 'rgba(147, 153, 176, 0.12)',
  // Brand specific
  brandPrimary: '#725AFF',
  brandPrimarySelected: 'rgba(114, 90, 255, 0.10)',
  brandGradientStart: '#E600FF',
  brandGradientEnd: '#002DC8',
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
