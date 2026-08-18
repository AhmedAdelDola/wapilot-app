export default {
  createConsumer: (url: string) => ({
    subscriptions: { create: () => ({}) },
    disconnect: () => {},
  }),
};
