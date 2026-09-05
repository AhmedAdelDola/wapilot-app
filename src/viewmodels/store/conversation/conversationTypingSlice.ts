import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TypingUser } from '@/models/types';
import { RootState } from '@/viewmodels/store';

interface TypingUserWithTimestamp {
  id: number;
  name: string;
  type: 'user' | 'contact';
  lastSeenAt: number;
  [key: string]: any;
}

interface TypingUserPayload {
  conversationId: number;
  user: TypingUser;
}

interface ConversationTypingState {
  records: { [key: number]: TypingUserWithTimestamp[] };
}

const TYPING_TIMEOUT_MS = 8000;
const EMPTY_TYPING_USERS: TypingUserWithTimestamp[] = [];

const initialState: ConversationTypingState = {
  records: {},
};

const conversationTypingSlice = createSlice({
  name: 'conversationTyping',
  initialState,
  reducers: {
    setTypingUsers: (state, action: PayloadAction<TypingUserPayload>) => {
      const { conversationId, user } = action.payload;
      const records = state.records[conversationId] || [];
      const hasUserRecordAlready = records.some(
        record => record.id === user.id && record.type === user.type,
      );
      if (!hasUserRecordAlready) {
        state.records = {
          ...state.records,
          [conversationId]: [
            ...records,
            { ...user, lastSeenAt: Date.now() } as TypingUserWithTimestamp,
          ],
        };
      } else {
        state.records = {
          ...state.records,
          [conversationId]: records.map(record =>
            record.id === user.id && record.type === user.type
              ? { ...record, lastSeenAt: Date.now() }
              : record,
          ),
        };
      }
    },
    removeTypingUser: (state, action: PayloadAction<TypingUserPayload>) => {
      const { conversationId, user } = action.payload;
      const records = state.records[conversationId] || [];
      state.records = {
        ...state.records,
        [conversationId]: records.filter(
          record => record.id !== user.id || record.type !== user.type,
        ),
      };
    },
    cleanupStaleTypingUsers: state => {
      const now = Date.now();
      const records = state.records;
      for (const conversationId of Object.keys(records)) {
        const id = Number(conversationId);
        const users = records[id] || [];
        const fresh = users.filter(
          user => now - user.lastSeenAt < TYPING_TIMEOUT_MS,
        );
        if (fresh.length !== users.length) {
          state.records = { ...state.records, [id]: fresh };
        }
      }
    },
  },
});

export const { setTypingUsers, removeTypingUser, cleanupStaleTypingUsers } =
  conversationTypingSlice.actions;

export const selectTypingUsers = (state: RootState) => state.conversationTyping.records;

export const selectTypingUsersByConversationId = (conversationId: number) =>
  createSelector(selectTypingUsers, records => records[conversationId] ?? EMPTY_TYPING_USERS);

export default conversationTypingSlice.reducer;
