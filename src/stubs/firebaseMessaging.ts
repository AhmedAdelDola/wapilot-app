// Stub for @react-native-firebase/messaging
// Matches the real package API: messaging() is called as a function

export default function messaging() {
  return {
    getToken: async () => 'stub-token',
    onTokenRefresh: (_callback: (token: string) => void) => () => {},
    requestPermission: async () => 1,
    hasPermission: async () => 1,
    setBackgroundMessageHandler: (_handler: (msg: any) => Promise<void>) => {},
    onNotificationOpenedApp: (_handler: (msg: any) => void) => () => {},
    getInitialNotification: async () => null,
    subscribeToTopic: async (_topic: string) => {},
    unsubscribeFromTopic: async (_topic: string) => {},
  };
}
