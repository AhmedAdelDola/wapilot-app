import { config } from '@/config';

/**
 * Wapilot App API Configuration
 *
 * Based on the Chatwoot Mobile Agent API Postman Collection
 * Base URL: https://omni.wapilot.net
 * WebSocket URL: wss://omni.wapilot.net
 *
 * Authentication: Devise Token Auth (access-token, client, uid)
 * Realtime: ActionCable at wss://omni.wapilot.net/cable
 */

export const API_CONFIG = {
  // Base URLs (from environment variables)
  baseUrl: config.chatwoot.baseUrl,
  websocketUrl: config.chatwoot.websocketUrl,
};
