export const requestPermission = async () => 1;
export const createChannel = async () => '';
export const displayNotification = async () => '';
export const cancelAllNotifications = async () => {};
export const setBadgeCount = async () => {};
export const getInitialNotification = async () => null;
export const onNotificationOpenedApp = (h: any) => () => {};
export const onForegroundEvent = (h: any) => () => {};
export const BACKGROUND_FETCH_RESULT = { NEW_DATA: 1 };
export const AndroidImportance = { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 };
export const EventType = { PRESS: 1, DISMISS: 2 };

export default {
  requestPermission,
  createChannel,
  displayNotification,
  cancelAllNotifications,
  setBadgeCount,
  getInitialNotification,
  onNotificationOpenedApp,
  onForegroundEvent,
  BACKGROUND_FETCH_RESULT,
};
