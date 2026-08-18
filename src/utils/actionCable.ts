const actionCableConnector = {
  init: (params: { pubSubToken: string; webSocketUrl: string; accountId: number; userId: number }) => {
    console.log('[ActionCable] Initializing with:', params.accountId);
  },
  disconnect: () => {
    console.log('[ActionCable] Disconnected');
  },
};

export default actionCableConnector;
