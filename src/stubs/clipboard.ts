import * as Clipboard from 'expo-clipboard';

export const getString = async (): Promise<string> => {
  try {
    return await Clipboard.getStringAsync();
  } catch {
    return '';
  }
};

export const setString = (s: string): void => {
  try {
    void Clipboard.setStringAsync(s);
  } catch {
    // Non-blocking
  }
};

export const hasString = async (): Promise<boolean> => {
  try {
    return await Clipboard.hasStringAsync();
  } catch {
    return false;
  }
};

export default {
  getString,
  setString,
  hasString,
};
