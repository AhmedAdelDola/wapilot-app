export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Chat: { conversationId: number };
  ChatScreen: {
    conversationId: number;
    primaryActorId?: number;
    primaryActorType?: string;
    isConversationOpenedExternally?: boolean;
    messageId?: number;
  };
  ContactDetails: { contactId: number };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
