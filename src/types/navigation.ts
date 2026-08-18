export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Chat: { conversationId: number };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
