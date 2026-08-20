import { useColorScheme } from 'react-native';
import { useAppSelector } from '@/hooks';
import { selectTheme } from '@/store/settings/settingsSelectors';
import { designSystem, ThemeColors, ThemeMode } from './designSystem';

type UseThemeReturn = {
  colors: ThemeColors;
  mode: ThemeMode;
  ds: typeof designSystem;
};

export const useTheme = (): UseThemeReturn => {
  const systemColorScheme = useColorScheme();
  const themeSetting = useAppSelector(selectTheme);

  let mode: ThemeMode;

  if (themeSetting === 'system') {
    mode = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    mode = themeSetting as ThemeMode;
  }

  return {
    colors: designSystem.colors[mode],
    mode,
    ds: designSystem,
  };
};
