import { apiService } from '@/models/services/APIService';
import type {
  ConversationPayload,
  MessagesPayload,
  MessagesAPIResponse,
  MessageBuilderPayload,
  SendMessageAPIResponse,
  ConversationListAPIResponse,
  ConversationAPIResponse,
  ToggleConversationStatusPayload,
  ToggleConversationStatusResponse,
  BulkActionPayload,
  AssigneePayload,
  AssigneeAPIResponse,
  MarkMessagesUnreadPayload,
  MarkMessagesUnreadAPIResponse,
  MarkMessageReadPayload,
  MarkMessageReadAPIResponse,
  MuteOrUnmuteConversationPayload,
  ConversationLabelPayload,
  AssignTeamPayload,
  AssignTeamAPIResponse,
  DeleteMessagePayload,
  DeleteMessageAPIResponse,
  TypingPayload,
  ConversationListResponse,
  MessagesResponse,
  ConversationResponse,
  MarkMessageReadOrUnreadResponse,
  ToggleConversationStatusAPIResponse,
  TogglePriorityPayload,
  TranslateMessagePayload,
  TranslateMessageAPIResponse,
  ConversationListMeta,
} from '@/viewmodels/store/conversation/conversationTypes';

import {
  transformConversation,
  transformConversationListMeta,
  transformMessage,
  transformConversationMeta,
} from '@/utils/camelCaseKeys';
import type { AxiosRequestConfig } from 'axios';

export class ConversationService {
  static async getConversations(payload: ConversationPayload): Promise<ConversationListResponse> {
    const { status, assigneeType, page, sortBy, inboxId = 0 } = payload;

    const params: Record<string, any> = {
      assignee_type: assigneeType || 'all',
      status: status || 'all',
      page: page || 1,
      sort_by: sortBy || 'latest',
    };
    if (inboxId && Number(inboxId) > 0) {
      params.inbox_id = inboxId;
    }
    const response = await apiService.get<any>('conversations', {
      params,
    });
    const resPayload = response.data?.data?.payload || response.data?.payload || [];
    const resMeta = response.data?.data?.meta || response.data?.meta || {};
    const conversations = Array.isArray(resPayload) ? resPayload : [];
    const transformedResponse: ConversationListResponse = {
      conversations: conversations.map(transformConversation),
      meta: transformConversationListMeta(resMeta),
      page,
    };
    return transformedResponse;
  }

  static async getConversationsMeta(
    payload: Partial<ConversationPayload> = {},
  ): Promise<ConversationListMeta> {
    const { status = 'all' as any, assigneeType = 'all' as any, inboxId = 0 } = payload;
    const params: Record<string, any> = {
      status,
      assignee_type: assigneeType,
    };
    if (inboxId && Number(inboxId) > 0) {
      params.inbox_id = inboxId;
    }
    try {
      const response = await apiService.get('conversations/meta', { params });
      const meta = response.data.meta || response.data;
      return transformConversationListMeta(meta);
    } catch {
      return {
        mineCount: 0,
        unassignedCount: 0,
        allCount: 0,
      };
    }
  }

  static async fetchConversation(conversationId: number): Promise<ConversationResponse> {
    const response = await apiService.get<ConversationAPIResponse>(
      `conversations/${conversationId}`,
    );

    const { data: conversation } = response;
    return {
      conversation: transformConversation(conversation),
    };
  }

  static async fetchPreviousMessages(payload: MessagesPayload): Promise<MessagesResponse> {
    const { conversationId, beforeId, afterId } = payload;

    const params: Record<string, number> = {};
    if (beforeId) {
      params.before = beforeId;
    }
    if (afterId) {
      params.after = afterId;
    }

    const response = await apiService.get<MessagesAPIResponse>(
      `conversations/${conversationId}/messages`,
      {
        params,
      },
    );
    const { meta, payload: messages } = response.data;
    return {
      meta: transformConversationMeta(meta),
      messages: messages.map(transformMessage),
      conversationId,
    };
  }

  static async sendMessage(
    conversationId: number,
    payload: MessageBuilderPayload,
    config: AxiosRequestConfig,
  ): Promise<SendMessageAPIResponse> {
    const response = await apiService.post<SendMessageAPIResponse>(
      `conversations/${conversationId}/messages`,
      payload,
      config,
    );
    return response.data;
  }

  static async toggleConversationStatus({
    conversationId,
    payload,
  }: ToggleConversationStatusPayload): Promise<ToggleConversationStatusResponse> {
    const response = await apiService.post<any>(
      `conversations/${conversationId}/toggle_status`,
      payload,
    );
    const data = response?.data?.payload || response?.data?.data || response?.data || {};
    const currentStatus = data.current_status || payload.status || 'open';
    const snoozedUntil = data.snoozed_until !== undefined ? data.snoozed_until : (payload.snoozed_until ?? null);
    return {
      conversationId,
      currentStatus,
      snoozedUntil,
    };
  }
  static async bulkAction(payload: BulkActionPayload): Promise<void> {
    await apiService.post('bulk_actions', payload);
  }
  static async assignConversation(payload: AssigneePayload): Promise<AssigneeAPIResponse> {
    const { conversationId, assigneeId, teamId } = payload;
    const params = {
      assignee_id: assigneeId,
      team_id: teamId,
    };
    const response = await apiService.post<AssigneeAPIResponse>(
      `conversations/${conversationId}/assignments`,
      params,
    );
    return response.data;
  }

  static async assignTeam(payload: AssignTeamPayload): Promise<AssignTeamAPIResponse> {
    const { conversationId, teamId } = payload;
    const response = await apiService.post<AssignTeamAPIResponse>(
      `conversations/${conversationId}/assignments?team_id=${teamId}`,
    );
    return response.data;
  }

  static async markMessagesUnread(
    payload: MarkMessagesUnreadPayload,
  ): Promise<MarkMessageReadOrUnreadResponse> {
    const { conversationId } = payload;
    const response = await apiService.post<MarkMessagesUnreadAPIResponse>(
      `conversations/${conversationId}/unread`,
    );
    const { id, unread_count: unreadCount, agent_last_seen_at: agentLastSeenAt } = response.data;
    return {
      conversationId: id,
      unreadCount,
      agentLastSeenAt,
    };
  }

  static async markMessageRead(
    payload: MarkMessageReadPayload,
  ): Promise<MarkMessageReadOrUnreadResponse> {
    const { conversationId } = payload;
    const response = await apiService.post<MarkMessageReadAPIResponse>(
      `conversations/${conversationId}/update_last_seen`,
    );
    const { id, unread_count: unreadCount, agent_last_seen_at: agentLastSeenAt } = response.data;
    return {
      conversationId: id,
      unreadCount,
      agentLastSeenAt,
    };
  }

  static async muteConversation(payload: MuteOrUnmuteConversationPayload): Promise<void> {
    const { conversationId } = payload;
    await apiService.post(`conversations/${conversationId}/mute`);
  }

  static async unmuteConversation(payload: MuteOrUnmuteConversationPayload): Promise<void> {
    const { conversationId } = payload;
    await apiService.post(`conversations/${conversationId}/unmute`);
  }

  static async addOrUpdateConversationLabels(payload: ConversationLabelPayload): Promise<void> {
    const { conversationId, labels } = payload;
    await apiService.post(`conversations/${conversationId}/labels`, { labels });
  }

  static async deleteMessage(payload: DeleteMessagePayload): Promise<DeleteMessageAPIResponse> {
    const { conversationId, messageId } = payload;
    const response = await apiService.delete<DeleteMessageAPIResponse>(
      `conversations/${conversationId}/messages/${messageId}`,
    );
    return response.data;
  }

  static async toggleTyping(payload: TypingPayload): Promise<void> {
    const { conversationId, typingStatus, isPrivate } = payload;
    await apiService.post(`conversations/${conversationId}/toggle_typing_status`, {
      typing_status: typingStatus,
      is_private: isPrivate,
    });
  }

  static async togglePriority(payload: TogglePriorityPayload): Promise<void> {
    const { conversationId, priority } = payload;
    await apiService.post(`conversations/${conversationId}/toggle_priority`, { priority });
  }

  static async translateMessage(
    payload: TranslateMessagePayload,
  ): Promise<TranslateMessageAPIResponse> {
    const { conversationId, messageId, targetLanguage } = payload;
    const response = await apiService.post<TranslateMessageAPIResponse>(
      `conversations/${conversationId}/messages/${messageId}/translate`,
      { target_language: targetLanguage },
    );
    return response.data;
  }
}
