export default {
  check: async (permission: string) => 'granted',
  request: async (permission: string) => 'granted',
  checkMultiple: async (permissions: string[]) => {
    const result: Record<string, string> = {};
    permissions.forEach(p => (result[p] = 'granted'));
    return result;
  },
  requestMultiple: async (permissions: string[]) => {
    const result: Record<string, string> = {};
    permissions.forEach(p => (result[p] = 'granted'));
    return result;
  },
  openSettings: async () => {},
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked', UNAVAILABLE: 'unavailable' },
  PERMISSIONS: {
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
  },
};
