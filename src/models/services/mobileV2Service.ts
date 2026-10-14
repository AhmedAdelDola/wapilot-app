import { apiService } from './APIService';
import { WebViewV2Descriptor } from '@/models/types/mobileV2';

let isV2SupportedState: boolean | null = null;
let lastCheckTimestamp = 0;
let hasActiveWebViewSessionState = false;
const RECHECK_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

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
   * Helper to check if a descriptor is valid and not expired
   */
  isDescriptorValid(descriptor?: WebViewV2Descriptor | null): boolean {
    if (!descriptor || descriptor.view_type !== 'webview' || !descriptor.url) {
      return false;
    }
    if (descriptor.expires_at) {
      const expiry = new Date(descriptor.expires_at).getTime();
      if (!isNaN(expiry) && expiry <= Date.now()) {
        return false;
      }
    }
    return true;
  },
};
