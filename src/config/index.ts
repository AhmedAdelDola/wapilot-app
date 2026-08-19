/**
 * App Configuration
 *
 * Centralized configuration using environment variables
 * Copy .env.example to .env and fill in your values
 */

export const config = {
  // Chatwoot Server
  chatwoot: {
    baseUrl: process.env.EXPO_PUBLIC_CHATWOOT_BASE_URL || 'https://omni.message-pro.com',
    websocketUrl: process.env.EXPO_PUBLIC_CHATWOOT_WEBSOCKET_URL || 'wss://omni.message-pro.com',
    minimumVersion: process.env.EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION || '4.1.0',
  },

  // App Info
  app: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'Message Pro',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'message-pro',
  },

  // Sentry (Error Tracking)
  sentry: {
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    projectName: process.env.EXPO_PUBLIC_SENTRY_PROJECT_NAME || '',
    orgName: process.env.EXPO_PUBLIC_SENTRY_ORG_NAME || '',
  },

  // Expo
  expo: {
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '',
  },

  // Firebase (Push Notifications)
  firebase: {
    iosGoogleServicesFile: process.env.EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE || '',
    androidGoogleServicesFile: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE || '',
  },

  // Apple (iOS)
  apple: {
    id: process.env.EXPO_APPLE_ID || '',
    teamId: process.env.EXPO_APPLE_TEAM_ID || '',
  },

  // Development
  development: {
    storybookEnabled: process.env.EXPO_STORYBOOK_ENABLED === 'true',
  },
} as const;
