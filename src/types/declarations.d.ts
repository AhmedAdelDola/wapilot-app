declare var module: { exports: any };
declare var require: any;

declare namespace JSX {
  type Element = import('react').JSX.Element;
}

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
  declare const FileViewer: {
    open: (path: string, options?: any) => Promise<void>;
  };
  export default FileViewer;
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
    config: (options: any) => {
      fetch: (
        method: string,
        url: string,
        body?: any,
        headers?: any,
      ) => Promise<{ info: any; path: () => string; readFile: () => Promise<any> }>;
    };
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
    originWhitelist?: string[];
    onMessage?: (event: any) => void;
    onLoad?: (event: any) => void;
    onLoadEnd?: (event: any) => void;
    onLoadStart?: (event: any) => void;
    injectedJavaScript?: string;
    javaScriptEnabled?: boolean;
    startInLoadingState?: boolean;
    scrollEnabled?: boolean;
    forceDarkOn?: boolean;
    style?: any;
  }

  export class WebView<P extends WebViewProps = WebViewProps> extends Component<P> {
    reload: () => void;
    goBack: () => void;
    goForward: () => void;
    injectJavaScript: (script: string) => void;
  }
  export default WebView;
}

declare module 'react-native-image-picker' {
  export interface Asset {
    base64?: string;
    uri?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    type?: string;
    fileName?: string;
    duration?: number;
    bitrate?: number;
    timestamp?: string;
    id?: string;
  }

  export interface ImagePickerResponse {
    didCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
    assets?: Asset[];
  }

  export const launchCamera: (options?: any) => Promise<ImagePickerResponse>;
  export const launchImageLibrary: (options?: any) => Promise<ImagePickerResponse>;
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
    getSystemName: () => string;
    getManufacturer: () => string;
    getApiLevel: () => number;
    getUniqueId: () => string;
    getDeviceType: () => string;
    isTablet: () => boolean;
    isEmulator: () => boolean;
    isLandscape: () => boolean;
    hasNotch: () => boolean;
  };
  export default DeviceInfo;
  export const getVersion: () => string;
  export const getBuildNumber: () => string;
  export const getDeviceId: () => string;
  export const getModel: () => string;
  export const getSystemVersion: () => string;
  export const getBrand: () => string;
  export const getBundleId: () => string;
  export const getApplicationName: () => string;
  export const getSystemName: () => string;
  export const getManufacturer: () => string;
  export const getApiLevel: () => number;
  export const getUniqueId: () => string;
  export const getDeviceType: () => string;
  export const isTablet: () => boolean;
  export const isEmulator: () => boolean;
  export const isLandscape: () => boolean;
  export const hasNotch: () => boolean;
}

declare module '@react-native-documents/picker' {
  export interface DocumentPickerResponse {
    uri: string;
    name?: string;
    size?: number;
    type?: string;
    fileCopyUri?: string | null;
    copyError?: string | null;
  }

  export const pick: (options?: any) => Promise<DocumentPickerResponse[]>;
  export const pickMultiple: (options?: any) => Promise<DocumentPickerResponse[]>;
  export const pickDirectory: (options?: any) => Promise<DocumentPickerResponse | null>;
  export const types: Record<string, string>;
  export const errorCodes: {
    OPERATION_CANCELED: string;
    IN_PROGRESS: string;
    UNKNOWN: string;
    INVALID_ARGUMENT: string;
  };
  export const isErrorWithCode: (error: unknown) => error is { code: string; message?: string };
  export default {
    pick: typeof pick,
    pickMultiple: typeof pickMultiple,
    pickDirectory: typeof pickDirectory,
    types: typeof types,
    errorCodes: typeof errorCodes,
    isErrorWithCode: typeof isErrorWithCode,
  };
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
  import React from 'react';
  export function create<T = any>(component: React.ComponentType<T>, type?: string): React.ComponentType<T>;
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
  export const Item: any;
  export const ItemTitle: any;
  export const ItemSubtitle: any;
  export const ItemIcon: any;
  export const ItemImage: any;
  export const Separator: any;
  export const Label: any;
  export const Group: any;
  export const Preview: any;
  export const PreviewFrame: any;
  export const Arrow: any;
}

declare module 'zeego/context-menu' {
  import React from 'react';
  export function create<T = any>(component: React.ComponentType<T>, type?: string): React.ComponentType<T>;
  export const Root: any;
  export const Trigger: any;
  export const Content: any;
  export const Item: any;
  export const ItemTitle: any;
  export const ItemSubtitle: any;
  export const ItemIcon: any;
  export const ItemImage: any;
  export const Separator: any;
  export const Label: any;
  export const Group: any;
  export const Preview: any;
  export const PreviewFrame: any;
  export const Arrow: any;
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

declare module '@chatwoot/react-native-widget' {
  import { Component } from 'react';

  export interface ChatWootWidgetProps {
    websiteToken?: string;
    locale?: string;
    baseUrl?: string;
    closeModal?: () => void;
    isModalVisible?: boolean;
    user?: any;
    customAttributes?: any;
  }

  export class ChatWootWidget extends Component<ChatWootWidgetProps> {}
  export default ChatWootWidget;
}

declare module '@chatwoot/markdown-to-txt' {
  const markdownToTxt: (markdown: string) => string;
  export default markdownToTxt;
}

declare module '@chatwoot/utils' {
  export const formatMessageContent: (content: string) => string;
  export const getMessagePlaceHolder: () => string;
  export const extractVariables: (text: string) => string[];
  export const getMessageVariables: (params: {
    conversation?: any;
    contact?: any;
  }) => Record<string, string>;
  export const replaceVariablesInMessage: (params: {
    message: string;
    variables: Record<string, string>;
  }) => string;
  export const getUndefinedVariablesInMessage: (params: {
    message: string;
    variables: Record<string, string>;
  }) => string[];
  export const createTypingIndicator: (
    onStart: () => void,
    onStop: () => void,
    idleTime: number,
  ) => { start: () => void; stop: () => void };
  export const evaluateSLAStatus: (params: {
    appliedSla?: any;
    chat?: any;
  }) => { type: string; threshold: string; icon: string; isSlaMissed: boolean } | null;
  export const MEDIA_FORMATS: string[];
  export const findComponentByType: (
    template: any,
    type: string,
  ) => { format?: string; text?: string; buttons?: any[] } | undefined;
  export const isSendableTemplate: (template: any) => boolean;
  export const renderTemplatePreview: (body: string, values: Record<string, string>) => string;
  export const extractFilenameFromUrl: (url: string) => string;
  export const isTwilioMediaTemplate: (template: any) => boolean;
  export const getTwilioMediaVariableKey: (template: any) => string | undefined;
  export const getTwilioMediaUrl: (template: any) => string;

  export type WhatsAppTemplateHeaderFormat =
    | 'TEXT'
    | 'IMAGE'
    | 'VIDEO'
    | 'DOCUMENT'
    | 'LOCATION';
  export type WhatsAppTemplateButton = {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text?: string;
    url?: string;
  };
  export type WhatsAppTemplateComponent = {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: WhatsAppTemplateHeaderFormat;
    text?: string;
    buttons?: WhatsAppTemplateButton[];
  };
  export type WhatsAppMessageTemplate = {
    name: string;
    language: string;
    category: string;
    namespace: string;
    status?: string;
    components?: WhatsAppTemplateComponent[];
  };
  export type TemplateButtonParam =
    | { type: 'url'; parameter: string; url?: string; variables?: string[] }
    | { type: 'copy_code'; parameter: string };
  export type WhatsAppProcessedParams = {
    body?: Record<string, string>;
    header?: { media_url?: string; media_type?: string; media_name?: string };
    buttons?: TemplateButtonParam[];
  };
  export type TwilioProcessedParams = Record<string, string>;
  export type TwilioContentTemplate = {
    contentSid: string;
    friendlyName: string;
    language: string;
    category: string;
    status: string;
    templateType: string;
    mediaType: string;
    body: string;
    variables: string[];
    types: Array<{ type: string; source?: string }>;
  };
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
    setUser: (user: any) => void;
  };
  export default Sentry;
  export const init: (options: any) => void;
  export const captureException: (error: any) => string;
  export const captureMessage: (message: string) => string;
  export const withScope: (callback: (scope: any) => void) => void;
  export const setTag: (key: string, value: string) => void;
  export const setExtra: (key: string, value: any) => void;
  export const setUser: (user: any) => void;
  export const ErrorBoundary: (props: any) => any;
  export const withProfiler: (component: any) => any;
}

declare module '@notifee/react-native' {
  const notifee: {
    createChannel: (options: any) => Promise<string>;
    displayNotification: (options: any) => Promise<void>;
    cancelAllNotifications: () => Promise<void>;
    setBadgeCount: (count: number) => Promise<void>;
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
