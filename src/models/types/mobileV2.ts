export interface WebViewV2Descriptor {
  view_type?: 'webview' | string;
  url?: string;
  page_url?: string;
  link?: string;
  redirect_url?: string;
  webview_url?: string;
  expires_at?: string;
  data?: any;
  [key: string]: any;
}

export type MobileV2ScreenType = 'conversations' | 'chat' | 'notifications' | 'calls';

