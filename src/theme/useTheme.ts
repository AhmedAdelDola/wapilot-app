import { useColorScheme } from 'react-native';
import { useAppSelector } from '@/hooks';
import { selectTheme } from '@/viewmodels/store/settings/settingsSelectors';
import { designSystem, ThemeColors, ThemeMode } from './designSystem';

export type UseThemeReturn = {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  ds: typeof designSystem;
  themeSetting: 'system' | 'light' | 'dark';
};

export const useTheme = (): UseThemeReturn => {
  const systemColorScheme = useColorScheme();
  const themeSetting = useAppSelector(selectTheme);

  const isDark =
    themeSetting === 'dark' ||
    (themeSetting === 'system' && systemColorScheme === 'dark');

  const mode: ThemeMode = isDark ? 'dark' : 'light';

  return {
    colors: designSystem.colors[mode],
    mode,
    isDark,
    ds: designSystem,
    themeSetting: (themeSetting || 'system') as 'system' | 'light' | 'dark',
  };
};

