import * as Haptics from 'expo-haptics';

export const useHaptic = () => {
  return () => {
    Haptics.selectionAsync();
  };
};
