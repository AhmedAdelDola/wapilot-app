import * as Haptics from 'expo-haptics';

export const useHaptic = (_type?: string) => {
  return () => {
    Haptics.selectionAsync();
  };
};
