import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';
import { useNavigation } from '@react-navigation/native';
import { ChatScreenDesign } from '@/screens/inbox/InboxChatDesign';

type ChatScreenProps = NativeStackScreenProps<TabBarExcludedScreenParamList, 'ChatScreen'>;

const ChatScreen = (props: ChatScreenProps) => {
  const navigation = useNavigation();
  const { conversationId } = props.route.params;

  return (
    <ChatScreenDesign
      conversationId={conversationId}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Tab' as never);
        }
      }}
    />
  );
};

export default ChatScreen;
