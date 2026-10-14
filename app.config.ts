import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    name: 'Message Pro',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'message-pro-mobile',
    version: '1.0.4',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'messagepro',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#101113',
      enableFullScreenImage_legacy: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.message.pro.com',
      buildNumber: '4',
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        NSCameraUsageDescription:
          'Message Pro requires access to your camera so you can take photos and record videos to send in chat messages and customer conversations.',
        NSPhotoLibraryUsageDescription:
          'Message Pro requires access to your photo library so you can select and attach photos and videos to send in chat messages and customer conversations.',
        NSMicrophoneUsageDescription:
          'Message Pro requires access to your microphone so you can record and send voice notes and audio messages in chat messages and customer conversations.',
        UIBackgroundModes: ['fetch', 'remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#101113' },
      package: 'com.message.pro.com',
      versionCode: 5,
      googleServicesFile: './google-services.json',
      permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'resize',
    },
    extra: {
      eas: {
        projectId: '9819b83a-87f0-46ff-be76-1ff2bcd2c2b8',
      },
    },
    owner: 'ahmed-adel12',
    plugins: [
      'expo-font',
      'expo-splash-screen',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Message Pro requires access to your photo library so you can select and attach photos and videos to send in chat messages and customer conversations.',
          cameraPermission:
            'Message Pro requires access to your camera so you can take photos and record videos to send in chat messages and customer conversations.',
        },
      ],
      'expo-document-picker',
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
          },
        },
      ],
      [
        '@react-native-firebase/app',
        {
          androidGoogleServicesFile: './google-services.json',
          iosGoogleServicesFile: './GoogleService-Info.plist',
        },
      ],
      '@react-native-firebase/messaging',
    ],
    androidNavigationBar: { backgroundColor: '#101113' },
  };
};
