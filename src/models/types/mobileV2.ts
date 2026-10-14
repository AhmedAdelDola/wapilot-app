export interface WebViewV2Descriptor {
  view_type: 'webview';
  url: string;
  page_url: string;
  expires_at: string;
}

export type MobileV2ScreenType = 'conversations' | 'chat' | 'notifications' | 'calls';
