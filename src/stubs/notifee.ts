export default {
  requestPermission: async () => 1,
  createChannel: async () => '',
  displayNotification: async () => '',
  cancelAllNotifications: async () => {},
  getInitialNotification: async () => null,
  onNotificationOpenedApp: (h: any) => () => {},
  onForegroundEvent: (h: any) => () => {},
  BACKGROUND_FETCH_RESULT: { NEW_DATA: 1 },
};
export const AndroidImportance = { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 };
export const EventType = { PRESS: 1, DISMISS: 2 };
