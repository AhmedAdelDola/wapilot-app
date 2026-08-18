export default {
  config: () => ({
    fetch: () => Promise.resolve({ json: () => ({}), text: () => '' }),
  }),
  polyfill: () => {},
};
