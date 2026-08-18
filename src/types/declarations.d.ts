declare module '@react-native-community/blur' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface BlurViewProps extends ViewProps {
    blurType?: string;
    blurAmount?: number;
    reducedTransparencyFallback?: boolean;
  }

  export class BlurView extends Component<BlurViewProps> {}
  export class VibrancyView extends Component<BlurViewProps> {}
}

declare module '@storybook/react' {
  export const storiesOf: any;
  export const addDecorator: any;
}

declare module 'zeego' {
  export const ContextMenu: any;
}

declare module 'react-native-audio-recorder-player' {
  export type PlayBackType = {
    currentPosition: number;
    duration: number;
  };

  export type RecordBackType = {
    currentPosition: number;
    duration: number;
    currentMetering?: number;
  };

  export enum AVEncodingOption {
    aac = 'aac',
    alac = 'alac',
    flac = 'flac',
    opus = 'opus',
  }

  export default class AudioRecorderPlayer {
    startRecorder: (path?: string, options?: any) => Promise<string>;
    stopRecorder: () => Promise<string>;
    resumeRecorder: () => Promise<string>;
    pauseRecorder: () => Promise<string>;
    startPlayer: (path?: string) => Promise<string>;
    stopPlayer: () => Promise<string>;
    pausePlayer: () => Promise<string>;
    resumePlayer: () => Promise<string>;
    seekToPlayer: (position: number) => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    addRecordBackListener: (cb: (e: RecordBackType) => void) => () => void;
    removeRecordBackListener: () => void;
    addPlayBackListener: (cb: (e: PlayBackType) => void) => () => void;
    removePlayBackListener: () => void;
  }
}

declare module 'react-native-file-viewer' {
  export default class FileViewer {
    open: (path: string) => Promise<void>;
  }
}

declare module 'react-native-fs' {
  export const DocumentDirectoryPath: string;
  export const CachesDirectoryPath: string;
  export const downloadFile: (options: any) => { promise: Promise<any> };
  export const readDir: (path: string) => Promise<any[]>;
  export const readFile: (path: string, encoding?: string) => Promise<string>;
  export const writeFile: (path: string, content: string, encoding?: string) => Promise<void>;
  export const unlink: (path: string) => Promise<void>;
  export const exists: (path: string) => Promise<boolean>;
  export const stat: (path: string) => Promise<any>;
  export const moveFile: (src: string, dest: string) => Promise<void>;
  export const copyFile: (src: string, dest: string) => Promise<void>;
  export const mkdir: (path: string) => Promise<void>;
}

declare module 'rn-fetch-blob' {
  const RNFetchBlob: {
    config: (options: any) => any;
    fs: {
      documentDir: string;
      cacheDir: string;
      CacheDir: string;
      dirs: {
        DocumentDir: string;
        CacheDir: string;
        DownloadDir: string;
      };
      readFile: (path: string, encoding?: string) => Promise<string>;
      writeFile: (path: string, content: string, encoding?: string) => Promise<void>;
      exists: (path: string) => Promise<boolean>;
      stat: (path: string) => Promise<{ size: number; lastModified: number; type: string; path: string }>;
      unlink: (path: string) => Promise<void>;
      ls: (path: string) => Promise<string[]>;
      cp: (src: string, dest: string) => Promise<void>;
      mv: (src: string, dest: string) => Promise<void>;
      mkdir: (path: string) => Promise<void>;
    };
    polyfill: {
      Blob: any;
      FormData: any;
      Fetch: any;
    };
    session: {
      get: (name: string) => any;
    };
  };
  export default RNFetchBlob;
}

declare module 'react-native-snackbar' {
  export default class Snackbar {
    static show: (options: { title: string; duration?: number; action?: { title: string; onPress: () => void } }) => void;
    static dismiss: () => void;
  }
}

declare module 'react-native-webview' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface WebViewProps extends ViewProps {
    source?: { uri?: string; html?: string };
    onMessage?: (event: any) => void;
    injectedJavaScript?: string;
    javaScriptEnabled?: boolean;
    style?: any;
  }

  export default class WebView extends Component<WebViewProps> {
    reload: () => void;
    goBack: () => void;
    goForward: () => void;
  }
}

declare module 'react-native-image-picker' {
  export const launchCamera: (options: any, callback: (response: any) => void) => void;
  export const launchImageLibrary: (options: any, callback: (response: any) => void) => void;
}

declare module 'react-native-image-modal' {
  import { Component } from 'react';
  export default class ImageModal extends Component<any> {}
}

declare module '@react-native-clipboard/clipboard' {
  const Clipboard: {
    getString: () => Promise<string>;
    setString: (content: string) => void;
  };
  export default Clipboard;
}

declare module 'react-native-permissions' {
  export const RESULTS: {
    UNAVAILABLE: string;
    DENIED: string;
    BLOCKED: string;
    LIMITED: string;
    GRANTED: string;
  };
  export const PERMISSIONS: any;
  export const check: (permission: string) => Promise<string>;
  export const request: (permission: string) => Promise<string>;
  export const checkMultiple: (permissions: string[]) => Promise<Record<string, string>>;
  export const requestMultiple: (permissions: string[]) => Promise<Record<string, string>>;
}

declare module '@react-native-community/netinfo' {
  const NetInfo: {
    fetch: () => Promise<{ isConnected: boolean; isInternetReachable: boolean | null; type: string }>;
    addEventListener: (listener: (state: any) => void) => () => void;
  };
  export default NetInfo;
}

declare module 'react-native-device-info' {
  const DeviceInfo: {
    getVersion: () => string;
    getBuildNumber: () => string;
    getDeviceId: () => string;
    getModel: () => string;
    getSystemVersion: () => string;
    getBrand: () => string;
    getBundleId: () => string;
    getApplicationName: () => string;
    isTablet: () => boolean;
    getDeviceType: () => string;
    getUniqueId: () => string;
  };
  export default DeviceInfo;
}

declare module '@react-native-documents/picker' {
  export const pick: (options?: any) => Promise<any[]>;
  export const pickMultiple: (options?: any) => Promise<any[]>;
  export const pickDirectory: () => Promise<any>;
}

declare module 'ffmpeg-kit-react-native' {
  export const FFmpegKit: {
    execute: (command: string) => Promise<any>;
    cancel: () => Promise<void>;
  };
  export const ReturnCode: {
    isValueSuccess: (code: any) => boolean;
  };
}

declare module 'zeego/dropdown-menu' {
  export const DropdownMenu: any;
}

declare module 'zeego/context-menu' {
  export const ContextMenu: any;
}

declare module 'react-native-ios-context-menu' {
  import { Component } from 'react';
  export const ContextMenuView: any;
  export const ContextMenuPreview: any;
  export const ContextMenuItem: any;
  export class ContextMenuProvider extends Component<any> {}
}

declare module 'react-native-ios-utilities' {
  export const HostView: any;
}

declare module 'react-native-markdown-display' {
  import { Component } from 'react';
  export default class Markdown extends Component<any> {}
}

declare module '@chatwoot/react-native-widget' {
  const ChatwootWidget: {
    init: (options: any) => void;
    open: () => void;
    close: () => void;
    setUser: (user: any) => void;
  };
  export default ChatwootWidget;
}

declare module '@chatwoot/markdown-to-txt' {
  const markdownToTxt: (markdown: string) => string;
  export default markdownToTxt;
}

declare module '@chatwoot/utils' {
  export const formatMessageContent: (content: string) => string;
  export const getMessagePlaceHolder: () => string;
}

declare module '@kesha-antonov/react-native-action-cable' {
  const ActionCable: {
    createConsumer: (url: string) => any;
  };
  export default ActionCable;
  export const ActionCableProvider: any;
  export const ActionCableConsumer: any;
  export const createConsumer: (url: string) => any;
}

declare module 'expo-haptics' {
  export const selectionAsync: () => Promise<void>;
  export const impactAsync: (style?: any) => Promise<void>;
  export const notificationAsync: (type?: any) => Promise<void>;
  export const ImpactFeedbackStyle: {
    Light: string;
    Medium: string;
    Heavy: string;
    Rigid: string;
    Soft: string;
  };
  export const NotificationFeedbackType: {
    Success: string;
    Warning: string;
    Error: string;
  };
}

declare module 'react-native-context-menu-view' {
  import { Component } from 'react';
  export default class ContextMenu extends Component<any> {}
}

declare module '@react-native-firebase/app' {
  const firebase: any;
  export default firebase;
}

declare module '@react-native-firebase/messaging' {
  const messaging: any;
  export default messaging;
}

declare module '@sentry/react-native' {
  const Sentry: {
    init: (options: any) => void;
    captureException: (error: any) => string;
    captureMessage: (message: string) => string;
    withScope: (callback: (scope: any) => void) => void;
    setTag: (key: string, value: string) => void;
    setExtra: (key: string, value: any) => void;
  };
  export default Sentry;
  export const init: (options: any) => void;
  export const captureException: (error: any) => string;
  export const captureMessage: (message: string) => string;
}

declare module '@notifee/react-native' {
  const notifee: {
    createChannel: (options: any) => Promise<string>;
    displayNotification: (options: any) => Promise<void>;
    cancelAllNotifications: () => Promise<void>;
    requestPermission: () => Promise<any>;
    onForegroundEvent: (handler: (event: any) => void) => () => void;
  };
  export default notifee;
  export const AndroidImportance: {
    DEFAULT: number;
    HIGH: number;
    LOW: number;
    MIN: number;
    NONE: number;
    MAX: number;
  };
  export const EventType: any;
}

declare module 'string.prototype.matchall' {
  const matchAll: (str: string, regexp: RegExp) => IterableIterator<RegExpMatchArray>;
  export default matchAll;
}
