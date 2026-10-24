import { apiService } from './APIService';
import { WebViewV2Descriptor } from '@/models/types/mobileV2';

let isV2SupportedState: boolean | null = null;
let lastCheckTimestamp = 0;
let hasActiveWebViewSessionState = false;
const RECHECK_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Helper to safely extract any URL returned by backend in various possible formats:
 * - Direct string url
 * - Object with { url, link, page_url, redirect_url, webview_url }
 * - Object with nested { data: { url, ... } }
 * - Any string property starting with http://, https://, or /
 */
export function extractUrlFromDescriptor(descriptor: any): string | null {
  if (!descriptor) return null;

  if (typeof descriptor === 'string') {
    const trimmed = descriptor.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
  }

  if (typeof descriptor === 'object') {
    const directKeys = [
      'url',
      'link',
      'page_url',
      'redirect_url',
      'webview_url',
    ];

    for (const key of directKeys) {
      const val = descriptor[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }

    if (descriptor.data && typeof descriptor.data === 'object') {
      for (const key of directKeys) {
        const val = descriptor.data[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          return val.trim();
        }
      }
    }

    // Fallback: search any string value that looks like a URL
    for (const key of Object.keys(descriptor)) {
      const val = descriptor[key];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
          return trimmed;
        }
      }
    }

    if (descriptor.data && typeof descriptor.data === 'object') {
      for (const key of Object.keys(descriptor.data)) {
        const val = descriptor.data[key];
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
            return trimmed;
          }
        }
      }
    }
  }

  return null;
}

export const mobileV2Service = {
  /**
   * Track whether a WebView session was established during this app run
   */
  hasActiveWebViewSession(): boolean {
    return hasActiveWebViewSessionState;
  },

  setHasActiveWebViewSession(active: boolean) {
    hasActiveWebViewSessionState = active;
  },

  /**
   * Check if v2 is supported on backend.
   * If it returned 404 previously, keeps false until cooldown expires to avoid UI flash.
   */
  isV2Supported(): boolean | null {
    if (isV2SupportedState === false && Date.now() - lastCheckTimestamp > RECHECK_COOLDOWN_MS) {
      isV2SupportedState = null; // Recheck after cooldown
    }
    return isV2SupportedState;
  },

  setV2Supported(supported: boolean) {
    isV2SupportedState = supported;
    lastCheckTimestamp = Date.now();
  },

  resetV2SupportCheck() {
    isV2SupportedState = null;
    lastCheckTimestamp = 0;
    hasActiveWebViewSessionState = false;
  },

  /**
   * Get the WebView descriptor for the conversation list
   * GET /api/v2/accounts/:account_id/conversations
   */
  async getConversationsDescriptor(accountId: number): Promise<WebViewV2Descriptor> {
    try {
      const response = await apiService.get<WebViewV2Descriptor>(
        `api/v2/accounts/${accountId}/conversations`,
      );
      this.setV2Supported(true);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        this.setV2Supported(false);
      }
      throw err;
    }
  },

  /**
   * Get the WebView descriptor for a specific conversation chat screen
   * GET /api/v2/accounts/:account_id/conversations/:conversation_id
   */
  async getConversationDetailDescriptor(
    accountId: number,
    conversationId: number,
  ): Promise<WebViewV2Descriptor> {
    try {
      const response = await apiService.get<WebViewV2Descriptor>(
        `api/v2/accounts/${accountId}/conversations/${conversationId}`,
      );
      this.setV2Supported(true);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // If v2 as a whole isn't deployed
        if (isV2SupportedState === false) {
          this.setV2Supported(false);
        }
      }
      throw err;
    }
  },

  /**
   * Get the WebView descriptor for the notifications list
   * GET /api/v2/accounts/:account_id/notifications
   */
  async getNotificationsDescriptor(accountId: number): Promise<WebViewV2Descriptor> {
    try {
      const response = await apiService.get<WebViewV2Descriptor>(
        `api/v2/accounts/${accountId}/notifications`,
      );
      this.setV2Supported(true);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        this.setV2Supported(false);
      }
      throw err;
    }
  },

  /**
   * Get the WebView descriptor for the calls list/page
   * GET /api/v2/accounts/:account_id/calls
   */
  async getCallsDescriptor(accountId: number): Promise<WebViewV2Descriptor> {
    try {
      const response = await apiService.get<WebViewV2Descriptor>(
        `api/v2/accounts/${accountId}/calls`,
      );
      this.setV2Supported(true);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        this.setV2Supported(false);
      }
      throw err;
    }
  },

  /**
   * Helper to check if a descriptor is valid and contains any usable link
   */
  isDescriptorValid(descriptor?: any): boolean {
    const url = extractUrlFromDescriptor(descriptor);
    return Boolean(url && url.length > 0);
  },
};

