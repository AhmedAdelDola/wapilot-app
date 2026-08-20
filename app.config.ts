import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    name: 'Message Pro',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'message-pro-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'messagepro',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
      enableFullScreenImage_legacy: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.messagepro.app',
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        NSCameraUsageDescription:
          'This app requires access to the camera to upload images and videos.',
        NSPhotoLibraryUsageDescription:
          'This app requires access to the photo library to upload images.',
        NSMicrophoneUsageDescription: 'This app requires access to the microphone to record audio.',
        UIBackgroundModes: ['fetch', 'remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
      package: 'com.messagepro.app',
      googleServicesFile: './google-services.json',
      permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
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
      'expo-image-picker',
      'expo-document-picker',
      [
        '@react-native-firebase/app',
        {
          androidGoogleServicesFile: './google-services.json',
          iosGoogleServicesFile: './GoogleService-Info.plist',
        },
      ],
      '@react-native-firebase/messaging',
    ],
    androidNavigationBar: { backgroundColor: '#ffffff' },
  };
};
