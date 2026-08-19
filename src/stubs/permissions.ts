export const RESULTS = { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked', UNAVAILABLE: 'unavailable' };
export const PERMISSIONS = {
  IOS: {
    CAMERA: 'ios.permission.CAMERA',
    PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    MICROPHONE: 'ios.permission.MICROPHONE',
  },
  ANDROID: {
    CAMERA: 'android.permission.CAMERA',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  },
};
export const check = async (permission: string) => 'granted';
export const request = async (permission: string) => 'granted';
export const checkMultiple = async (permissions: string[]) => {
  const result: Record<string, string> = {};
  permissions.forEach(p => (result[p] = 'granted'));
  return result;
};
export const requestMultiple = async (permissions: string[]) => {
  const result: Record<string, string> = {};
  permissions.forEach(p => (result[p] = 'granted'));
  return result;
};
export const openSettings = async () => {};

export default {
  check,
  request,
  checkMultiple,
  requestMultiple,
  openSettings,
  RESULTS,
  PERMISSIONS,
};
