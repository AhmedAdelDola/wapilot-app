const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

const stubsDir = path.resolve(__dirname, 'src/stubs');
const srcDir = path.resolve(__dirname, 'src');

// Map native packages to our stubs for Expo Go compatibility
const extraNodeModules = {
  // Sentry
  '@sentry/react-native': path.join(stubsDir, 'sentry.ts'),

  // Notifications
  '@notifee/react-native': path.join(stubsDir, 'notifee.ts'),

  // Blur
  '@react-native-community/blur': path.join(stubsDir, 'blur.ts'),

  // WebView
  'react-native-webview': path.join(stubsDir, 'webview.ts'),

  // UI
  'react-native-snackbar': path.join(stubsDir, 'snackbar.ts'),
  'zeego': path.join(stubsDir, 'zeego.ts'),
  'zeego/dropdown-menu': path.join(stubsDir, 'zeego.ts'),
  'zeego/context-menu': path.join(stubsDir, 'zeego.ts'),
  'react-native-ios-context-menu': path.join(stubsDir, 'iosContextMenu.ts'),
  'react-native-ios-utilities': path.join(stubsDir, 'iosUtilities.ts'),
  'react-native-image-modal': path.join(stubsDir, 'imageModal.ts'),

  // Clipboard
  '@react-native-clipboard/clipboard': path.join(stubsDir, 'clipboard.ts'),

  // Media
  'react-native-image-picker': path.join(stubsDir, 'imagePicker.ts'),
  'react-native-audio-recorder-player': path.join(stubsDir, 'audioRecorder.ts'),
  'ffmpeg-kit-react-native': path.join(stubsDir, 'ffmpeg.ts'),

  // File system
  'react-native-file-viewer': path.join(stubsDir, 'fileViewer.ts'),
  'react-native-fs': path.join(stubsDir, 'fs.ts'),
  'rn-fetch-blob': path.join(stubsDir, 'fetchBlob.ts'),

  // Permissions & Network
  'react-native-permissions': path.join(stubsDir, 'permissions.ts'),
  '@react-native-community/netinfo': path.join(stubsDir, 'netInfo.ts'),

  // Chatwoot specific
  '@chatwoot/react-native-widget': path.join(stubsDir, 'chatwootWidget.ts'),
  '@chatwoot/markdown-to-txt': path.join(stubsDir, 'markdownToTxt.ts'),
  '@chatwoot/utils': path.join(stubsDir, 'chatwootUtils.ts'),

  // Action Cable - using native WebSocket via src/utils/actionCable.ts
  
  // Document picker - using expo-document-picker via alias
  '@react-native-documents/picker': path.join(stubsDir, 'documentPickerExpo.ts'),
  
  // Device info
  'react-native-device-info': path.join(stubsDir, 'deviceInfo.ts'),

  // Bare imports (matching Chatwoot's tsconfig "*" -> "src/*" paths)
  'i18n': path.join(srcDir, 'i18n'),
};

// In EAS builds, use real Firebase packages (native modules are compiled)
// In local dev (Expo Go), use stubs since Firebase native modules aren't available
if (process.env.EAS_BUILD !== 'true') {
  extraNodeModules['@react-native-firebase/app'] = path.join(stubsDir, 'firebaseApp.ts');
  extraNodeModules['@react-native-firebase/messaging'] = path.join(stubsDir, 'firebaseMessaging.ts');
}

config.resolver.extraNodeModules = extraNodeModules;

// Resolve bare imports like 'i18n' to 'src/i18n' (matching Chatwoot's tsconfig paths)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If it starts with @/ or . or is absolute, use default resolution
  if (moduleName.startsWith('@/') || moduleName.startsWith('.') || path.isAbsolute(moduleName)) {
    return context.resolveRequest(context, moduleName, platform);
  }
  // If it's in extraNodeModules, use that
  const extra = config.resolver.extraNodeModules[moduleName];
  if (extra) {
    // If extra is a directory, resolve to index file
    if (fs.existsSync(extra) && fs.statSync(extra).isDirectory()) {
      const extensions = ['index.ts', 'index.tsx', 'index.js', 'index.ts/js'];
      for (const ext of ['index.ts', 'index.tsx', 'index.js']) {
        const candidate = path.join(extra, ext);
        if (fs.existsSync(candidate)) {
          return { filePath: candidate, type: 'sourceFile' };
        }
      }
    }
    return { filePath: extra, type: 'sourceFile' };
  }
  // Try resolving from src/ directory
  const srcPath = path.join(srcDir, moduleName);
  if (fs.existsSync(srcPath)) {
    if (fs.statSync(srcPath).isDirectory()) {
      for (const ext of ['index.ts', 'index.tsx', 'index.js']) {
        const candidate = path.join(srcPath, ext);
        if (fs.existsSync(candidate)) {
          return { filePath: candidate, type: 'sourceFile' };
        }
      }
    }
    return { filePath: srcPath, type: 'sourceFile' };
  }
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (fs.existsSync(srcPath + ext)) {
      return { filePath: srcPath + ext, type: 'sourceFile' };
    }
  }
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
