import { apiService } from '@/models/services/APIService';
import type {
  NotificationResponse,
  MarkAsReadPayload,
  NotificationAPIResponse,
  InboxSortTypes,
  NotificationFilterType,
} from '@/viewmodels/store/notification/notificationTypes';
import { transformNotification, transformNotificationMeta } from '@/utils/camelCaseKeys';
import { NotificationFilterParams } from '@/viewmodels/store/notification/notificationTypes';

export class NotificationService {
  static async getNotifications(
    page: number = 1,
    sort_order: InboxSortTypes,
    filterType: NotificationFilterType = 'new',
  ): Promise<NotificationResponse> {
    const filterParams = NotificationFilterParams[filterType];
    const params = [
      `sort_order=${sort_order}`,
      `page=${page}`,
      filterParams,
    ]
      .filter(Boolean)
      .join('&');
    const response = await apiService.get<NotificationAPIResponse>(`notifications?${params}`);
    const { payload, meta } = response.data.data;
    const notifications = payload.map(transformNotification);
    return {
      payload: notifications,
      meta: transformNotificationMeta(meta),
    };
  }

  static async markAllAsRead(): Promise<void> {
    await apiService.post(`notifications/read_all`);
  }

  static async markAsRead(payload: MarkAsReadPayload): Promise<void> {
    await apiService.post(`notifications/read_all`, {
      primary_actor_id: payload.primaryActorId,
      primary_actor_type: payload.primaryActorType,
    });
  }

  static async markAsUnread(notificationId: number): Promise<void> {
    await apiService.post(`notifications/${notificationId}/unread`);
  }

  static async delete(notificationId: number): Promise<void> {
    await apiService.delete(`notifications/${notificationId}`);
  }
}
