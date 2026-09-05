import { createDraftSafeSelector, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/viewmodels/store';
import { conversationAdapter } from './conversationSlice';
import { FilterState } from '@/viewmodels/store/conversation/conversationFilterSlice';
import { CONVERSATION_PRIORITY_ORDER } from '@/constants';
import { shouldApplyFilters } from '@/utils/conversationUtils';
import type { Conversation } from '@/models/types';
import { MESSAGE_TYPES } from '@/constants';

export const selectConversationsState = (state: RootState) => state.conversations;

export const {
  selectAll: selectAllConversations,
  selectById: selectConversationById,
  selectIds: selectConversationIds,
} = conversationAdapter.getSelectors<RootState>(selectConversationsState);

export const selectConversationsLoading = createSelector(
  selectConversationsState,
  state => state.isLoadingConversations,
);

export const selectConversationError = createSelector(
  selectConversationsState,
  state => state.error,
);

export const selectConversationFetching = createSelector(
  selectConversationsState,
  state => state.isConversationFetching,
);

export const selectIsAllConversationsFetched = createSelector(
  selectConversationsState,
  state => state.isAllConversationsFetched,
);


export const selectIsAllMessagesFetched = (conversationId: number) =>
  createSelector(
    selectConversationsState,
    state => state.isAllMessagesFetchedByConversation?.[conversationId] ?? false,
  );

export const selectIsLoadingMoreMessages = createSelector(
  selectConversationsState,
  state => state.isLoadingMoreMessages,
);

export const selectMessageLoadError = createSelector(
  selectConversationsState,
  state => state.messageLoadError,
);

export const selectConversationLoadError = createSelector(
  selectConversationsState,
  state => state.conversationLoadError,
);

export const selectLastFetchedPage = createSelector(
  selectConversationsState,
  state => state.lastFetchedPage,
);

export const selectIsLoadingMessages = createSelector(
  selectConversationsState,
  state => state.isLoadingMessages,
);

export const getFilteredConversations = createDraftSafeSelector(
  [
    selectAllConversations,
    (_, filters: FilterState) => filters,
    (_, __, userId: number | undefined) => userId,
  ],
  (conversations, filters, userId) => {
    const { assignee_type: assigneeType, sort_by: sortBy } = filters;
    let sortType = filters.sort_by; // Create mutable variable

    type SortComparator = {
      latest: (a: Conversation, b: Conversation) => number;
      sort_on_created_at: (a: Conversation, b: Conversation) => number;
      sort_on_priority: (a: Conversation, b: Conversation) => number;
    };

    const comparator: SortComparator = {
      latest: (a, b) => (Number(b.lastActivityAt) || 0) - (Number(a.lastActivityAt) || 0),
      sort_on_created_at: (a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0),
      sort_on_priority: (a, b) => {
        const priorityA = a.priority || 'low';
        const priorityB = b.priority || 'low';
        return CONVERSATION_PRIORITY_ORDER[priorityA] - CONVERSATION_PRIORITY_ORDER[priorityB];
      },
    };

    // Type guard to ensure sortBy is a valid key of comparator
    const isValidSortBy = (sort: string): sort is keyof SortComparator => {
      return sort in comparator;
    };

    if (!isValidSortBy(sortBy)) {
      // Default to 'latest' if invalid sortBy
      sortType = 'latest';
    }

    const sortedConversations = [...conversations].sort(comparator[sortType as keyof SortComparator]);

    if (assigneeType === 'me') {
      return sortedConversations.filter(conversation => {
        const { assignee } = conversation.meta;
        const shouldFilter = shouldApplyFilters(conversation, filters);
        const isAssignedToMe = assignee && Number(assignee.id) === Number(userId);
        return isAssignedToMe && shouldFilter;
      });
    }
    if (assigneeType === 'unassigned') {
      return sortedConversations.filter(conversation => {
        const isUnAssigned = !conversation.meta.assignee;
        const shouldFilter = shouldApplyFilters(conversation, filters);
        return isUnAssigned && shouldFilter;
      });
    }

    return sortedConversations.filter(conversation => {
      const shouldFilter = shouldApplyFilters(conversation, filters);
      return shouldFilter;
    });
  },
);

const parseMessageTimestamp = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val > 1e11 ? val : val * 1000;
  if (typeof val === 'string') {
    const n = Number(val);
    if (!isNaN(n) && n > 0) return n > 1e11 ? n : n * 1000;
    const d = new Date(val).getTime();
    return !isNaN(d) ? d : 0;
  }
  return 0;
};

export const getMessagesByConversationId = createDraftSafeSelector(
  [
    (state: RootState, params: { conversationId: number }) =>
      selectConversationById(state, params.conversationId)?.messages,
  ],
  messages => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const seen = new Set<string | number>();
    const unique: typeof messages = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const key = m.id;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(m);
      }
    }
    unique.sort((a, b) => parseMessageTimestamp(a.createdAt) - parseMessageTimestamp(b.createdAt));
    return unique;
  },
);

export const getLastEmailInSelectedChat = createDraftSafeSelector(
  [
    (state: RootState, params: { conversationId: number }) =>
      selectConversationById(state, params.conversationId),
  ],
  conversation => {
    if (!conversation || !conversation.messages) {
      return null;
    }
    const lastEmail = [...conversation.messages].reverse().find(message => {
      const { contentAttributes, messageType } = message;
      const email = contentAttributes?.email || ({} as { from?: string[] });
      const isIncomingOrOutgoing =
        messageType === MESSAGE_TYPES.OUTGOING || messageType === MESSAGE_TYPES.INCOMING;
      if (email.from && isIncomingOrOutgoing) {
        return true;
      }
      return false;
    });
    return lastEmail || null;
  },
);

export const selectUnreadConversationCount = createSelector(
  selectAllConversations,
  conversations => conversations.filter(c => c.unreadCount > 0).length,
);
