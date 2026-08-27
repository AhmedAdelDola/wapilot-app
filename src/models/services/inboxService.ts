import { apiService } from '@/models/services/APIService';
import type { InboxResponse } from '@/viewmodels/store/inbox/inboxTypes';
import { transformInbox } from '@/utils/camelCaseKeys';

export class InboxService {
  static async index(): Promise<InboxResponse> {
    const response = await apiService.get<InboxResponse>('inboxes');
    const inboxes = response.data.payload.map(transformInbox);
    return {
      payload: inboxes,
    };
  }
}
