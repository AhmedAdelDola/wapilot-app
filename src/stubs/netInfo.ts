export default {
  fetch: async () => ({ isConnected: true, type: 'wifi' }),
  addEventListener: (cb: any) => () => {},
};
