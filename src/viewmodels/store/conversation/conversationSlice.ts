import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { Conversation } from '@/models/types/Conversation';
import { conversationActions } from './conversationActions';
import { findPendingMessageIndex } from '@/utils/conversationUtils';

import { MESSAGE_TYPES } from '@/constants';
import { Message } from '@/models/types/Message';
import { PendingMessage } from './conversationTypes';

export interface ConversationState {
  meta: {
    mineCount: number;
    unassignedCount: number;
    allCount: number;
  };
  error: string | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isAllConversationsFetched: boolean;
  isAllMessagesFetched: boolean;
  isAllMessagesFetchedByConversation: Record<number, boolean>;
  isConversationFetching: boolean;
  isChangingConversationStatus: boolean;
}

export const conversationAdapter = createEntityAdapter<Conversation>();

const initialState = conversationAdapter.getInitialState<ConversationState>({
  meta: {
    mineCount: 0,
    unassignedCount: 0,
    allCount: 0,
  },
  error: null,
  isLoadingConversations: false,
  isAllConversationsFetched: false,
  isLoadingMessages: false,
  isAllMessagesFetched: false,
  isAllMessagesFetchedByConversation: {},
  isConversationFetching: false,
  isChangingConversationStatus: false,
});

const isOutdatedConversationUpdate = (
  existingConversation: Conversation | undefined,
  incomingConversation: Conversation,
) => {
  const existingUpdatedAt = existingConversation?.updatedAt;
  const incomingUpdatedAt = incomingConversation.updatedAt;
  return (
    typeof existingUpdatedAt === 'number' &&
    typeof incomingUpdatedAt === 'number' &&
    incomingUpdatedAt < existingUpdatedAt
  );
};

const shouldKeepLocalStatusMarker = (
  existingConversation: Conversation | undefined,
  incomingConversation: Conversation,
) => {
  const localStatusUpdatedAt = existingConversation?.localStatusUpdatedAt;
  const existingUpdatedAt = existingConversation?.updatedAt;
  const incomingUpdatedAt = incomingConversation.updatedAt;
  return (
    typeof localStatusUpdatedAt === 'number' &&
    typeof existingUpdatedAt === 'number' &&
    typeof incomingUpdatedAt === 'number' &&
    localStatusUpdatedAt === existingUpdatedAt &&
    incomingUpdatedAt <= localStatusUpdatedAt
  );
};

const shouldPreserveLocalStatus = (
  existingConversation: Conversation | undefined,
  incomingConversation: Conversation,
) => {
  return (
    shouldKeepLocalStatusMarker(existingConversation, incomingConversation) &&
    existingConversation?.status !== incomingConversation.status &&
    existingConversation?.localStatusPreviousStatus === incomingConversation.status
  );
};

const preserveLocalStatus = (
  existingConversation: Conversation | undefined,
  incomingConversation: Conversation,
) => {
  if (!existingConversation) {
    return incomingConversation;
  }
  if (!shouldKeepLocalStatusMarker(existingConversation, incomingConversation)) {
    return {
      ...incomingConversation,
      localStatusUpdatedAt: undefined,
      localStatusPreviousStatus: undefined,
    };
  }
  if (!shouldPreserveLocalStatus(existingConversation, incomingConversation)) {
    return {
      ...incomingConversation,
      localStatusUpdatedAt: existingConversation.localStatusUpdatedAt,
      localStatusPreviousStatus: existingConversation.localStatusPreviousStatus,
    };
  }
  return {
    ...incomingConversation,
    status: existingConversation.status,
    snoozedUntil: existingConversation.snoozedUntil,
    localStatusUpdatedAt: existingConversation.localStatusUpdatedAt,
    localStatusPreviousStatus: existingConversation.localStatusPreviousStatus,
  };
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    clearAllConversations: state => {
      conversationAdapter.removeAll(state);
      state.isAllConversationsFetched = false;
      state.isAllMessagesFetched = false;
      state.isAllMessagesFetchedByConversation = {};
      state.error = null;
    },
    addConversation: (state, action) => {
      const conversation = action.payload;
      conversationAdapter.addOne(state, conversation);
    },
    updateConversation: (state, action) => {
      const conversation = action.payload as Conversation;
      const conversationIds = conversationAdapter.getSelectors().selectIds(state);
      if (conversationIds.includes(conversation.id)) {
        const existingConversation = state.entities[conversation.id];
        if (isOutdatedConversationUpdate(existingConversation, conversation)) {
          return;
        }
        const { messages, ...conversationAttributes } = preserveLocalStatus(
          existingConversation,
          conversation,
        );
        conversationAdapter.updateOne(state, {
          id: conversation.id,
          changes: conversationAttributes,
        });
      } else {
        conversationAdapter.addOne(state, conversation);
      }
    },
    addOrUpdateMessage: (state, action) => {
      const message = action.payload as PendingMessage | Message;
      const { conversationId } = message;
      if (!conversationId) {
        return;
      }
      const conversation = state.entities[conversationId];
      if (!conversation) {
        return;
      }
      if (message.messageType === MESSAGE_TYPES.INCOMING) {
        conversation.canReply = true;
      }
      if (!conversation.messages) {
        conversation.messages = [];
      }
      const pendingMessageIndex = findPendingMessageIndex(conversation, message);
      if (pendingMessageIndex !== -1) {
        conversation.messages[pendingMessageIndex] = message as Message;
      } else {
        conversation.messages.push(message as Message);
      }
      conversation.timestamp = message.createdAt;
      conversation.lastActivityAt = message.createdAt;
      if ((message as any).conversation?.unreadCount !== undefined) {
        conversation.unreadCount = (message as any).conversation.unreadCount;
      } else if (
        message.messageType === MESSAGE_TYPES.INCOMING ||
        (message as any).messageType === 0
      ) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      if ((message as Message).messageType !== MESSAGE_TYPES.ACTIVITY) {
        conversation.lastNonActivityMessage = message as Message;
      }
    },
    updateConversationLastActivity: (state, action) => {
      const { conversationId, lastActivityAt } = action.payload;
      const conversation = state.entities[conversationId];
      if (!conversation) {
        return;
      }
      conversation.lastActivityAt = lastActivityAt;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(conversationActions.fetchConversations.pending, state => {
        state.error = null;
        state.isLoadingConversations = true;
      })
      .addCase(conversationActions.fetchConversations.fulfilled, (state, { payload }) => {
        const { conversations, meta, page } = payload;
        const conversationsToUpsert = conversations.filter(
          conversation =>
            !isOutdatedConversationUpdate(state.entities[conversation.id], conversation),
        );
        const transformedConversations = conversationsToUpsert.map(conversation =>
          preserveLocalStatus(state.entities[conversation.id], conversation),
        );
        if (page === 1) {
          conversationAdapter.setAll(state, transformedConversations);
        } else {
          conversationAdapter.upsertMany(state, transformedConversations);
        }
        state.isLoadingConversations = false;
        state.isAllConversationsFetched = conversations.length < 20;
        state.meta = meta;
      })
      .addCase(conversationActions.fetchConversationsMeta.fulfilled, (state, { payload }) => {
        state.meta = payload;
      })
      .addCase(conversationActions.fetchConversations.rejected, state => {
        state.isLoadingConversations = false;
        state.isAllConversationsFetched = false;
      })
      .addCase(conversationActions.fetchConversation.pending, state => {
        state.error = null;
        state.isConversationFetching = true;
      })
      .addCase(conversationActions.fetchConversation.fulfilled, (state, { payload }) => {
        const { conversation } = payload;
        if (isOutdatedConversationUpdate(state.entities[conversation.id], conversation)) {
          state.isConversationFetching = false;
          return;
        }
        const existing = state.entities[conversation.id];
        conversationAdapter.upsertOne(
          state,
          preserveLocalStatus(existing, {
            ...conversation,
            messages: existing?.messages || conversation.messages || [],
          }),
        );
        state.isConversationFetching = false;
      })
      .addCase(conversationActions.fetchConversation.rejected, state => {
        state.isConversationFetching = false;
        state.error = state.error || 'Unable to load conversation';
      })
      .addCase(conversationActions.fetchPreviousMessages.pending, state => {
        state.isLoadingMessages = true;
      })
      .addCase(conversationActions.fetchPreviousMessages.fulfilled, (state, action) => {
        const { messages, conversationId, meta: responseMeta } = action.payload;
        if (!state.entities[conversationId]) {
          return;
        }
        const conversation = state.entities[conversationId]!;
        const { afterId } = action.meta.arg;
        if (afterId) {
          // Search navigation: merge, deduplicate, sort ascending by time
          const existingIds = new Set(conversation.messages.map(m => m.id));
          const newMessages = messages.filter(m => !existingIds.has(m.id));
          conversation.messages.push(...newMessages);
          const sorted = [...conversation.messages].sort(
            (a, b) => Number(a.createdAt) - Number(b.createdAt),
          );
          conversation.messages.splice(0, conversation.messages.length, ...sorted);
          state.isAllMessagesFetchedByConversation ||= {};
          state.isAllMessagesFetchedByConversation[conversationId] = false;
        } else {
          // Normal top-scroll pagination: prepend older messages
          conversation.messages.unshift(...messages);
          state.isAllMessagesFetchedByConversation ||= {};
          state.isAllMessagesFetchedByConversation[conversationId] = messages.length < 20;
        }
        conversation.meta = {
          ...conversation.meta,
          ...responseMeta,
        };
        state.isLoadingMessages = false;
      })
      .addCase(conversationActions.fetchPreviousMessages.rejected, state => {
        state.isLoadingMessages = false;
      })
      .addCase(conversationActions.toggleConversationStatus.pending, state => {
        state.isChangingConversationStatus = true;
      })
      .addCase(conversationActions.toggleConversationStatus.fulfilled, (state, { payload }) => {
        const { conversationId, currentStatus, snoozedUntil } = payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.localStatusPreviousStatus = conversation.status;
        conversation.status = currentStatus;
        conversation.snoozedUntil = snoozedUntil;
        conversation.localStatusUpdatedAt = conversation.updatedAt;
        state.isChangingConversationStatus = false;
      })
      .addCase(conversationActions.toggleConversationStatus.rejected, state => {
        state.isChangingConversationStatus = false;
      })
      .addCase(conversationActions.assignConversation.fulfilled, (state, action) => {
        const { conversationId, assigneeId } = action.meta.arg;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        if (!assigneeId || assigneeId === 0) {
          conversation.meta = {
            ...conversation.meta,
            assignee: null,
          };
        } else {
          const raw = action.payload as any;
          const agent = raw?.data?.payload || raw?.payload || raw?.meta?.assignee || raw;
          if (agent && agent.id) {
            conversation.meta = {
              ...conversation.meta,
              assignee: {
                ...(conversation.meta?.assignee || {}),
                id: agent.id,
                name: agent.name || agent.available_name || '',
                email: agent.email || '',
                thumbnail: agent.thumbnail || agent.avatar_url || '',
              } as any,
            };
          }
        }
      })
      .addCase(conversationActions.muteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.muted = true;
      })
      .addCase(conversationActions.unmuteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.muted = false;
      })
      .addCase(conversationActions.markMessagesUnread.fulfilled, (state, action) => {
        const { conversationId, unreadCount, agentLastSeenAt } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.unreadCount = unreadCount;
        conversation.agentLastSeenAt = agentLastSeenAt;
      })
      .addCase(conversationActions.markMessageRead.fulfilled, (state, action) => {
        const { conversationId, agentLastSeenAt, unreadCount } = action.payload;
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        conversation.unreadCount = unreadCount;
        conversation.agentLastSeenAt = agentLastSeenAt;
      })
      .addCase(conversationActions.translateMessage.fulfilled, (state, action) => {
        const { conversationId, messageId, targetLanguage, content } = action.payload;
        if (!content) {
          return;
        }
        const conversation = state.entities[conversationId];
        if (!conversation) {
          return;
        }
        const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          const message = conversation.messages[messageIndex];
          const existing =
            message.contentAttributes ?? ({} as NonNullable<Message['contentAttributes']>);
          conversation.messages[messageIndex] = {
            ...message,
            contentAttributes: {
              ...existing,
              translations: {
                ...existing.translations,
                [targetLanguage]: content,
              },
            },
          };
        }
      });
  },
});

export const {
  clearAllConversations,
  updateConversation,
  updateConversationLastActivity,
  addOrUpdateMessage,
  addConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;