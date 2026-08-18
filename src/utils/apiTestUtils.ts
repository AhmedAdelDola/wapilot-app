import { apiService } from '@/services/APIService';
import { API_CONFIG, API_PARAMS, API_BODIES } from '@/config/apiConfig';

/**
 * API Test Utility
 *
 * This utility provides functions to test the Chatwoot API endpoints
 * based on the Postman collection. Use these functions to verify
 * your API configuration is working correctly.
 */

// Authentication
export const authApi = {
  /**
   * Sign in with email and password
   * POST /auth/sign_in
   */
  signIn: async (email: string, password: string) => {
    const response = await apiService.post(API_CONFIG.auth.signIn, {
      email,
      password,
    });
    return response;
  },

  /**
   * Validate current session
   * GET /auth/validate_token
   */
  validateToken: async () => {
    const response = await apiService.get(API_CONFIG.auth.validateToken);
    return response;
  },

  /**
   * Sign out
   * DELETE /auth/sign_out
   */
  signOut: async () => {
    const response = await apiService.delete(API_CONFIG.auth.signOut);
    return response;
  },
};

// Profile
export const profileApi = {
  /**
   * Get user profile
   * GET /api/v1/profile
   */
  getProfile: async () => {
    const response = await apiService.get(API_CONFIG.profile.getProfile);
    return response;
  },

  /**
   * Set active account
   * PUT /api/v1/profile/set_active_account
   */
  setActiveAccount: async (accountId: number) => {
    const response = await apiService.put(API_CONFIG.profile.setActiveAccount, {
      profile: { account_id: accountId },
    });
    return response;
  },

  /**
   * Set availability status
   * POST /api/v1/profile/availability
   */
  setAvailability: async (accountId: number, availability: string) => {
    const response = await apiService.post(API_CONFIG.profile.setAvailability, {
      profile: {
        account_id: accountId,
        availability,
      },
    });
    return response;
  },
};

// Inboxes
export const inboxApi = {
  /**
   * List inboxes
   * GET /api/v1/accounts/{account_id}/inboxes
   */
  listInboxes: async (accountId: number) => {
    const response = await apiService.get(API_CONFIG.accounts.listInboxes);
    return response;
  },
};

// Conversations
export const conversationApi = {
  /**
   * List conversations
   * GET /api/v1/accounts/{account_id}/conversations
   */
  listConversations: async (accountId: number, params = API_PARAMS.conversationList) => {
    const response = await apiService.get(API_CONFIG.conversations.list, { params });
    return response;
  },

  /**
   * Get conversation counts
   * GET /api/v1/accounts/{account_id}/conversations/meta
   */
  getConversationCounts: async (accountId: number, params = API_PARAMS.conversationCounts) => {
    const response = await apiService.get(API_CONFIG.conversations.counts, { params });
    return response;
  },

  /**
   * Search conversations
   * GET /api/v1/accounts/{account_id}/conversations/search
   */
  searchConversations: async (accountId: number, query: string, params = API_PARAMS.conversationSearch) => {
    const response = await apiService.get(API_CONFIG.conversations.search, {
      params: { ...params, q: query },
    });
    return response;
  },

  /**
   * Get conversation details
   * GET /api/v1/accounts/{account_id}/conversations/{conversation_id}
   */
  getConversation: async (accountId: number, conversationId: number) => {
    const url = API_CONFIG.conversations.get.replace(':conversation_id', String(conversationId));
    const response = await apiService.get(url);
    return response;
  },

  /**
   * List conversation messages
   * GET /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
   */
  listMessages: async (accountId: number, conversationId: number, params = API_PARAMS.conversationMessages) => {
    const url = API_CONFIG.conversations.listMessages.replace(':conversation_id', String(conversationId));
    const response = await apiService.get(url, { params });
    return response;
  },

  /**
   * Send message
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
   */
  sendMessage: async (accountId: number, conversationId: number, content: string, isPrivate = false) => {
    const url = API_CONFIG.conversations.sendMessage.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url, {
      content,
      private: isPrivate,
    });
    return response;
  },

  /**
   * Change conversation status
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_status
   */
  changeStatus: async (accountId: number, conversationId: number, status: string) => {
    const url = API_CONFIG.conversations.changeStatus.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url, { status });
    return response;
  },

  /**
   * Assign conversation
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/assignments
   */
  assignConversation: async (accountId: number, conversationId: number, assigneeId: number) => {
    const url = API_CONFIG.conversations.assign.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url, {
      assignee_id: assigneeId,
      assignee_type: 'User',
    });
    return response;
  },

  /**
   * Set typing status
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_typing_status
   */
  setTypingStatus: async (accountId: number, conversationId: number, typingStatus: string, isPrivate = false) => {
    const url = API_CONFIG.conversations.setTypingStatus.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url, {
      typing_status: typingStatus,
      is_private: isPrivate,
    });
    return response;
  },

  /**
   * Mark conversation as read
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/update_last_seen
   */
  markRead: async (accountId: number, conversationId: number) => {
    const url = API_CONFIG.conversations.markRead.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url);
    return response;
  },

  /**
   * Mark conversation as unread
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/unread
   */
  markUnread: async (accountId: number, conversationId: number) => {
    const url = API_CONFIG.conversations.markUnread.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url);
    return response;
  },

  /**
   * Set conversation priority
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_priority
   */
  setPriority: async (accountId: number, conversationId: number, priority: boolean) => {
    const url = API_CONFIG.conversations.setPriority.replace(':conversation_id', String(conversationId));
    const response = await apiService.post(url, { priority });
    return response;
  },
};

// Contacts
export const contactApi = {
  /**
   * List contacts
   * GET /api/v1/accounts/{account_id}/contacts
   */
  listContacts: async (accountId: number, params = API_PARAMS.contactList) => {
    const response = await apiService.get(API_CONFIG.contacts.list, { params });
    return response;
  },

  /**
   * Search contacts
   * GET /api/v1/accounts/{account_id}/contacts/search
   */
  searchContacts: async (accountId: number, query: string, params = API_PARAMS.contactSearch) => {
    const response = await apiService.get(API_CONFIG.contacts.search, {
      params: { ...params, q: query },
    });
    return response;
  },

  /**
   * Get contact details
   * GET /api/v1/accounts/{account_id}/contacts/{contact_id}
   */
  getContact: async (accountId: number, contactId: number) => {
    const url = API_CONFIG.contacts.get.replace(':contact_id', String(contactId));
    const response = await apiService.get(url, {
      params: { include_contact_inboxes: true },
    });
    return response;
  },

  /**
   * Update contact
   * PATCH /api/v1/accounts/{account_id}/contacts/{contact_id}
   */
  updateContact: async (accountId: number, contactId: number, data: { name?: string; email?: string }) => {
    const url = API_CONFIG.contacts.update.replace(':contact_id', String(contactId));
    const response = await apiService.put(url, data, {
      params: { include_contact_inboxes: false },
    });
    return response;
  },

  /**
   * Get contact conversations
   * GET /api/v1/accounts/{account_id}/contacts/{contact_id}/conversations
   */
  getContactConversations: async (accountId: number, contactId: number) => {
    const url = API_CONFIG.contacts.conversations.replace(':contact_id', String(contactId));
    const response = await apiService.get(url);
    return response;
  },
};

// Notifications
export const notificationApi = {
  /**
   * List notifications
   * GET /api/v1/accounts/{account_id}/notifications
   */
  listNotifications: async (accountId: number, params = API_PARAMS.notificationList) => {
    const response = await apiService.get(API_CONFIG.notifications.list, { params });
    return response;
  },

  /**
   * Get unread notification count
   * GET /api/v1/accounts/{account_id}/notifications/unread_count
   */
  getUnreadCount: async (accountId: number) => {
    const response = await apiService.get(API_CONFIG.notifications.unreadCount);
    return response;
  },

  /**
   * Mark all notifications as read
   * POST /api/v1/accounts/{account_id}/notifications/read_all
   */
  markAllRead: async (accountId: number) => {
    const response = await apiService.post(API_CONFIG.notifications.markAllRead);
    return response;
  },

  /**
   * Mark notification as unread
   * POST /api/v1/accounts/{account_id}/notifications/{notification_id}/unread
   */
  markUnread: async (accountId: number, notificationId: number) => {
    const url = API_CONFIG.notifications.markUnread.replace(':notification_id', String(notificationId));
    const response = await apiService.post(url);
    return response;
  },
};
