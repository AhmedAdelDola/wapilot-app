import { useWindowDimensions, PixelRatio } from 'react-native';

// Guideline base dimensions based on standard modern device (iPhone 13 / 14 / 15)
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

export const BREAKPOINTS = {
  compact: 360,
  phone: 390,
  largePhone: 480,
  tablet: 768,
  desktop: 1024,
};

export const scale = (size: number, width: number): number => {
  return (width / GUIDELINE_BASE_WIDTH) * size;
};

export const moderateScale = (size: number, width: number, factor = 0.5): number => {
  return size + (scale(size, width) - size) * factor;
};

export const clamp = (min: number, val: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};

export type ResponsiveInfo = {
  width: number;
  height: number;
  fontScale: number;
  pixelRatio: number;
  isSmallScreen: boolean; // < 375px (e.g. iPhone SE, compact Androids)
  isCompactPhone: boolean; // <= 360px
  isMediumPhone: boolean; // 375px - 479px
  isLargePhone: boolean; // 480px - 767px (large phablets / foldables folded)
  isTablet: boolean; // >= 768px (iPads, Android tablets)
  isLandscape: boolean;
  contentMaxWidth: number;
  sheetMaxWidth: number;
  drawerMaxWidth: number;
  scale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  clamp: (min: number, val: number, max: number) => number;
};

export const useResponsive = (): ResponsiveInfo => {
  const { width, height, fontScale } = useWindowDimensions();
  const pixelRatio = PixelRatio.get();

  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  const isCompactPhone = width <= 360;
  const isMediumPhone = width >= 375 && width < 480;
  const isLargePhone = width >= 480 && width < 768;
  const isTablet = width >= 768;

  // Safe maximum readable widths for cards, modals, and sheets on wide displays
  const contentMaxWidth = isTablet ? 640 : width;
  const sheetMaxWidth = isTablet ? 540 : width;
  const drawerMaxWidth = 340;

  return {
    width,
    height,
    fontScale,
    pixelRatio,
    isSmallScreen,
    isCompactPhone,
    isMediumPhone,
    isLargePhone,
    isTablet,
    isLandscape,
    contentMaxWidth,
    sheetMaxWidth,
    drawerMaxWidth,
    scale: (size: number) => scale(size, width),
    moderateScale: (size: number, factor?: number) => moderateScale(size, width, factor),
    clamp,
  };
};
