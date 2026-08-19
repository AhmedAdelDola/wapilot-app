import { getStore } from '@/store/storeAccessor';
import { transformMessage } from '@/utils/camelCaseKeys';

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
  if (payload.account_id && accountId && payload.account_id !== accountId) return;

  switch (event) {
    case 'message.created': {
      console.log('[ActionCable] 📩 message.created payload keys:', Object.keys(payload));
      console.log('[ActionCable] 📩 message.created conversationId:', payload.conversation_id ?? payload.conversationId ?? 'MISSING');
      const message = transformMessage(payload);
      console.log('[ActionCable] 📩 transformed message conversationId:', message.conversationId);
      store.dispatch({
        type: 'conversation/addOrUpdateMessage',
        payload: message,
      });
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
    case 'conversation.updated':
    case 'conversation.created':
    case 'conversation.status_changed': {
      store.dispatch({
        type: 'conversation/updateConversation',
        payload,
      });
      break;
    }
    case 'assignee.changed': {
      store.dispatch({
        type: 'conversation/updateConversation',
        payload,
      });
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
        console.log('[ActionCable] 📩 Event:', msg.message.event);
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

const actionCableConnector = {
  init: (params: { pubSubToken: string; webSocketUrl: string; accountId: number; userId: number }) => {
    disconnect();
    savedParams = params;
    connect();
  },
  disconnect,
};

export default actionCableConnector;
