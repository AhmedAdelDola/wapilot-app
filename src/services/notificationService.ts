import { apiService } from '@/services/APIService';

/**
 * Notifications Service
 *
 * Based on Postman Collection:
 * - List Notifications: GET /api/v1/accounts/{account_id}/notifications?page=1
 * - Get Unread Notification Count: GET /api/v1/accounts/{account_id}/notifications/unread_count
 * - Mark All Notifications Read: POST /api/v1/accounts/{account_id}/notifications/read_all
 * - Mark Notification Unread: POST /api/v1/accounts/{account_id}/notifications/{notification_id}/unread
 */

export interface Notification {
  id: number;
  type: string;
  read_at: number | null;
  created_at: number;
  account_id: number;
  user_id: number;
  actor: {
    id: number;
    name: string;
    avatar_url: string;
    thumbnail: string;
  };
  secondary_actor?: {
    id: number;
    name: string;
    avatar_url: string;
    thumbnail: string;
  };
  conversation: {
    id: number;
    display_id: number;
    unread_count: number;
  };
  payload: Record<string, unknown>;
}

export interface NotificationListResponse {
  data: {
    payload: Notification[];
    meta: {
      count: number;
      current_page: number;
      total_pages: number;
    };
  };
}

class NotificationService {
  /**
   * List Notifications
   * GET /api/v1/accounts/{account_id}/notifications?page=1
   */
  async listNotifications(params: {
    page?: number;
  } = {}): Promise<NotificationListResponse['data']> {
    const response = await apiService.get('notifications', {
      params: {
        page: params.page || 1,
      },
    });
    return response.data.data;
  }

  /**
   * Get Unread Notification Count
   * GET /api/v1/accounts/{account_id}/notifications/unread_count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiService.get('notifications/unread_count');
    return response.data.unread_count;
  }

  /**
   * Mark All Notifications Read
   * POST /api/v1/accounts/{account_id}/notifications/read_all
   */
  async markAllRead(): Promise<void> {
    await apiService.post('notifications/read_all');
  }

  /**
   * Mark Notification Unread
   * POST /api/v1/accounts/{account_id}/notifications/{notification_id}/unread
   */
  async markUnread(notificationId: number): Promise<void> {
    await apiService.post(`notifications/${notificationId}/unread`);
  }
}

export const notificationService = new NotificationService();
