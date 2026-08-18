// Stub for @react-native-firebase/messaging
// Replace with real package when building dev client

export default function messaging() {
  return {
    getToken: async () => 'stub-token',
    onTokenRefresh: (callback: any) => () => {},
    requestPermission: async () => 1,
    hasPermission: async () => 1,
    setBackgroundMessageHandler: async (handler: any) => {},
    onNotificationOpenedApp: (handler: any) => () => {},
    getInitialNotification: async () => null,
    subscribeToTopic: async (topic: string) => {},
    unsubscribeFromTopic: async (topic: string) => {},
  };
}
