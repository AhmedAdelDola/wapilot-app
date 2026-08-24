import { AppState } from 'react-native';
import { getStore } from '@/store/storeAccessor';
import {
  transformConversation,
  transformMessage,
  transformNotification,
} from '@/utils/camelCaseKeys';
import { conversationActions } from '@/store/conversation/conversationActions';

const PRESENCE_INTERVAL = 20000;
const RECONNECT_BASE = 1000;
const RECONNECT_MAX = 30000;

let ws: WebSocket | null = null;
let presenceTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = RECONNECT_BASE;
let isConnecting = false;
let savedParams: { pubSubToken: string; webSocketUrl: string; accountId: number; userId: number } | null = null;

const CHANNEL = 'RoomChannel';

const handleReceived = (data: any) => {
  if (!data?.event || !data?.data) return;

  const { event, data: payload } = data;
  let store;
  try {
    store = getStore();
  } catch {
    return;
  }
  if (!store) return;

  const accountId = (store.getState().auth.user as any)?.account_id;
  if (payload.account_id && accountId && Number(payload.account_id) !== Number(accountId)) return;

  console.log(`[ActionCable] ⚡ Event received: ${event}`, payload?.id || payload?.conversation_id || '');

  switch (event) {
    case 'message.created': {
      const message = transformMessage(payload);
      const conversationId = message.conversationId;

      if (conversationId) {
        const state = store.getState();
        const existingConv = state.conversations?.entities?.[conversationId];

        if (!existingConv) {
          // New conversation or not currently in store -> fetch the conversation so it appears in Inbox
          store.dispatch(conversationActions.fetchConversation(conversationId) as any);
        } else {
          store.dispatch({
            type: 'conversation/addOrUpdateMessage',
            payload: message,
          });
        }
      }
      break;
    }

    case 'message.updated': {
      const message = transformMessage(payload);
      store.dispatch({
        type: 'conversation/addOrUpdateMessage',
        payload: message,
      });
      break;
    }

    case 'conversation.created':
    case 'conversation.updated':
    case 'conversation.status_changed':
    case 'conversation.contact_changed':
    case 'assignee.changed': {
      const conversation = transformConversation(payload);
      store.dispatch({
        type: 'conversation/updateConversation',
        payload: conversation,
      });
      break;
    }

    case 'conversation.read': {
      const convId = payload.id ?? payload.conversation_id;
      if (convId) {
        store.dispatch({
          type: 'conversation/markMessageRead/fulfilled',
          payload: {
            conversationId: Number(convId),
            unreadCount: payload.unread_count ?? 0,
            agentLastSeenAt: payload.agent_last_seen_at,
          },
        });
      }
      break;
    }

    case 'conversation.unread': {
      const convId = payload.id ?? payload.conversation_id;
      if (convId) {
        store.dispatch({
          type: 'conversation/markMessagesUnread/fulfilled',
          payload: {
            conversationId: Number(convId),
            unreadCount: payload.unread_count ?? 1,
            agentLastSeenAt: payload.agent_last_seen_at,
          },
        });
      }
      break;
    }

    case 'conversation.typing_on': {
      if (payload.user) {
        store.dispatch({
          type: 'conversationTyping/setTypingUsers',
          payload: {
            conversationId: payload.conversation_id,
            user: payload.user,
          },
        });
      }
      break;
    }

    case 'conversation.typing_off': {
      if (payload.user) {
        store.dispatch({
          type: 'conversationTyping/removeTypingUser',
          payload: {
            conversationId: payload.conversation_id,
            user: payload.user,
          },
        });
      }
      break;
    }

    case 'presence.update': {
      if (payload.users) {
        store.dispatch({
          type: 'auth/setCurrentUserAvailability',
          payload: { users: payload.users },
        });
      }
      break;
    }

    case 'notification.created': {
      try {
        const notification = transformNotification(payload);
        store.dispatch({
          type: 'notification/addNotification',
          payload: { notification },
        });
      } catch (e) {
        console.error('[ActionCable] Error transforming notification:', e);
      }
      break;
    }

    default:
      break;
  }
};

const send = (data: Record<string, any>) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(data));
};

const subscribe = () => {
  if (!savedParams) return;
  const identifier = JSON.stringify({
    channel: CHANNEL,
    pubsub_token: savedParams.pubSubToken,
    account_id: savedParams.accountId,
    user_id: savedParams.userId,
  });

  console.log('[ActionCable] Subscribing with identifier:', JSON.stringify({
    channel: CHANNEL,
    account_id: savedParams.accountId,
    user_id: savedParams.userId,
  }));
  send({ command: 'subscribe', identifier });

  if (presenceTimer) clearInterval(presenceTimer);
  presenceTimer = setInterval(() => {
    send({
      command: 'message',
      identifier,
      data: JSON.stringify({ action: 'update_presence' }),
    });
  }, PRESENCE_INTERVAL);
};

const connect = () => {
  if (!savedParams) {
    console.warn('[ActionCable] connect() called but no params saved');
    return;
  }
  if (isConnecting || (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING))) {
    console.warn('[ActionCable] Already connected/connecting, skip');
    return;
  }

  isConnecting = true;
  const url = savedParams.webSocketUrl;

  console.log('[ActionCable] ========================================');
  console.log('[ActionCable] Connecting to:', url);
  console.log('[ActionCable] Account ID:', savedParams.accountId);
  console.log('[ActionCable] User ID:', savedParams.userId);
  console.log('[ActionCable] ========================================');
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[ActionCable] ✅ WebSocket OPEN - connection established');
    isConnecting = false;
    reconnectDelay = RECONNECT_BASE;
    subscribe();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'welcome') {
        console.log('[ActionCable] ✅ Welcome received');
        return;
      }
      if (msg.type === 'ping') return;

      if (msg.type === 'confirm_subscription') {
        console.log('[ActionCable] ✅ Subscribed to', CHANNEL);
        return;
      }

      if (msg.type === 'reject_subscription') {
        console.warn('[ActionCable] ❌ Subscription rejected:', JSON.stringify(msg));
        return;
      }

      if (msg.message) {
        handleReceived(msg.message);
      }
    } catch {
      // Ignore parse errors
    }
  };

  ws.onerror = (error) => {
    console.error('[ActionCable] ❌ WebSocket error:', JSON.stringify(error));
    isConnecting = false;
  };

  ws.onclose = (event) => {
    console.log('[ActionCable] 🔌 Closed:', event.code, event.reason);
    isConnecting = false;
    cleanup();

    // Reconnect with exponential backoff
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX);
      connect();
    }, reconnectDelay);
  };
};

const cleanup = () => {
  if (presenceTimer) {
    clearInterval(presenceTimer);
    presenceTimer = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const disconnect = () => {
  cleanup();
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  isConnecting = false;
  savedParams = null;
};

// Reconnect automatically when app comes to foreground
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active' && savedParams) {
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      console.log('[ActionCable] App active - reconnecting WebSocket...');
      connect();
    }
  }
});

const actionCableConnector = {
  init: (params: { pubSubToken: string; webSocketUrl: string; accountId: number; userId: number }) => {
    disconnect();
    savedParams = params;
    connect();
  },
  disconnect,
};

export default actionCableConnector;
