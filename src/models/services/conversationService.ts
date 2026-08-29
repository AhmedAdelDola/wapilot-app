import { apiService } from '@/models/services/APIService';

/**
 * Conversations Service
 *
 * Based on Postman Collection:
 * - List Conversations: GET /api/v1/accounts/{account_id}/conversations
 * - Conversation Counts: GET /api/v1/accounts/{account_id}/conversations/meta
 * - Search Conversations: GET /api/v1/accounts/{account_id}/conversations/search
 * - Get Conversation: GET /api/v1/accounts/{account_id}/conversations/{conversation_id}
 * - List Conversation Messages: GET /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
 * - Send Message: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
 * - Send Message with Attachment: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
 * - Change Conversation Status: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_status
 * - Assign Conversation: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/assignments
 * - Set Typing Status: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_typing_status
 * - Mark Conversation Read: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/update_last_seen
 * - Mark Conversation Unread: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/unread
 * - Set Priority: POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_priority
 */

export interface Conversation {
  id: number;
  account_id: number;
  inbox_id: number;
  status: string;
  messages: Message[];
  last_non_activity_message: Message | null;
  meta: {
    sender: Contact;
    assignee: Agent | null;
    team: Team | null;
    channel: string;
  };
  labels: string[];
  unread_count: number;
  created_at: number;
  updated_at: number;
  last_activity_at: number;
}

export interface Message {
  id: number;
  content: string;
  message_type: string;
  content_type: string;
  status: string;
  created_at: number;
  private: boolean;
  sender: {
    id: number;
    name: string;
    available_name: string;
    avatar_url: string;
    type: string;
    availability_status: string;
    thumbnail: string;
  };
  attachments?: Array<{
    id: number;
    file_type: string;
    file_url: string;
    thumb_url: string;
  }>;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  avatar_url: string;
  thumbnail: string;
}

export interface Agent {
  id: number;
  name: string;
  available_name: string;
  avatar_url: string;
  thumbnail: string;
  availability_status: string;
}

export interface Team {
  id: number;
  name: string;
}

export interface ConversationListResponse {
  data: {
    meta: {
      mine_count: number;
      unassigned_count: number;
      all_count: number;
    };
    payload: Conversation[];
  };
}

export interface MessagesResponse {
  data: {
    meta: Record<string, unknown>;
    payload: Message[];
  };
}

class ConversationService {
  /**
   * List Conversations
   * GET /api/v1/accounts/{account_id}/conversations?status=open&assignee_type=me&page=1
   */
  async listConversations(params: {
    status?: string;
    assignee_type?: string;
    page?: number;
  } = {}): Promise<ConversationListResponse['data']> {
    const response = await apiService.get('conversations', {
      params: {
        status: params.status || 'open',
        assignee_type: params.assignee_type || 'me',
        page: params.page || 1,
      },
    });
    return response.data.data;
  }

  /**
   * Conversation Counts
   * GET /api/v1/accounts/{account_id}/conversations/meta?status=open&assignee_type=me
   */
  async getConversationCounts(params: {
    status?: string;
    assignee_type?: string;
  } = {}): Promise<{ mine_count: number; unassigned_count: number; all_count: number }> {
    const response = await apiService.get('conversations/meta', {
      params: {
        status: params.status || 'open',
        assignee_type: params.assignee_type || 'me',
      },
    });
    const data = response.data.data;
    return data.meta || data;
  }

  /**
   * Search Conversations
   * GET /api/v1/accounts/{account_id}/conversations/search?q=hello&page=1
   */
  async searchConversations(query: string, params: {
    page?: number;
  } = {}): Promise<ConversationListResponse['data']> {
    const response: any = await apiService.get('conversations/search', {
      params: {
        q: query,
        page: params.page || 1,
      },
    });
    console.log('[TEMP SEARCH SVC] response.data keys =', response?.data ? Object.keys(response.data) : response?.data, '| response.data.data keys =', response?.data?.data ? Object.keys(response.data.data) : response?.data?.data);
    const body = response?.data ?? response;
    const inner = body?.data ?? body;
    return inner;
  }

  /**
   * Get Conversation
   * GET /api/v1/accounts/{account_id}/conversations/{conversation_id}
   */
  async getConversation(conversationId: number): Promise<{ data: Conversation }> {
    const response = await apiService.get(`conversations/${conversationId}`);
    return response.data;
  }

  /**
   * List Conversation Messages
   * GET /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages?before=
   */
  async listMessages(conversationId: number, params: {
    before?: string;
  } = {}): Promise<MessagesResponse['data']> {
    const response = await apiService.get(`conversations/${conversationId}/messages`, {
      params,
    });
    return response.data.data;
  }

  /**
   * Send Message
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
   *
   * Body: { "content": "Hello from the mobile agent app", "private": false }
   */
  async sendMessage(conversationId: number, content: string, isPrivate: boolean = false): Promise<{ data: Message }> {
    const response = await apiService.post(`conversations/${conversationId}/messages`, {
      content,
      private: isPrivate,
    });
    return response.data;
  }

  /**
   * Send Message with Attachment
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
   *
   * Uses FormData for file uploads
   */
  async sendMessageWithAttachment(
    conversationId: number,
    content: string,
    isPrivate: boolean,
    file: FormData
  ): Promise<{ data: Message }> {
    const response = await apiService.post(
      `conversations/${conversationId}/messages`,
      file,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Change Conversation Status
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_status
   *
   * Body: { "status": "resolved" }
   */
  async changeStatus(conversationId: number, status: string): Promise<{
    payload: {
      conversation_id: number;
      current_status: string;
    };
  }> {
    const response = await apiService.post(`conversations/${conversationId}/toggle_status`, {
      status,
    });
    return response.data;
  }

  /**
   * Assign Conversation
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/assignments
   *
   * Body: { "assignee_id": 1, "assignee_type": "User" }
   */
  async assignConversation(conversationId: number, assigneeId: number): Promise<void> {
    await apiService.post(`conversations/${conversationId}/assignments`, {
      assignee_id: assigneeId,
      assignee_type: 'User',
    });
  }

  /**
   * Set Typing Status
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_typing_status
   *
   * Body: { "typing_status": "on", "is_private": false }
   */
  async setTypingStatus(conversationId: number, typingStatus: string, isPrivate: boolean = false): Promise<void> {
    await apiService.post(`conversations/${conversationId}/toggle_typing_status`, {
      typing_status: typingStatus,
      is_private: isPrivate,
    });
  }

  /**
   * Mark Conversation Read
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/update_last_seen
   */
  async markRead(conversationId: number): Promise<void> {
    await apiService.post(`conversations/${conversationId}/update_last_seen`);
  }

  /**
   * Mark Conversation Unread
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/unread
   */
  async markUnread(conversationId: number): Promise<void> {
    await apiService.post(`conversations/${conversationId}/unread`);
  }

  /**
   * Set Priority
   * POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/toggle_priority
   *
   * Body: { "priority": true }
   */
  async setPriority(conversationId: number, priority: boolean): Promise<void> {
    await apiService.post(`conversations/${conversationId}/toggle_priority`, {
      priority,
    });
  }
}

export const conversationService = new ConversationService();
