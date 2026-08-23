import { config } from '@/config';

/**
 * Message Pro App API Configuration
 *
 * Based on the Chatwoot Mobile Agent API Postman Collection
 * Base URL: https://omni.message-pro.com
 * WebSocket URL: wss://omni.message-pro.com/cable
 *
 * Authentication: Devise Token Auth (access-token, client, uid)
 * Realtime: ActionCable at wss://omni.message-pro.com/cable
 */

export const API_CONFIG = {
  // Base URLs (from environment variables)
  baseUrl: config.chatwoot.baseUrl,
  websocketUrl: config.chatwoot.websocketUrl,
};
