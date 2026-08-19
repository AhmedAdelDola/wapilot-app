export const fetch = async () => ({ isConnected: true, type: 'wifi' });
export const addEventListener = (cb: any) => () => {};
export const useNetInfo = () => ({ isConnected: true, type: 'wifi' });

export default {
  fetch,
  addEventListener,
  useNetInfo,
};
