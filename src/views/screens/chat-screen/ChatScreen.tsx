import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabBarExcludedScreenParamList } from '@/views/navigation/tabs/AppTabs';
import { useNavigation } from '@react-navigation/native';
import { ChatScreenDesign } from '@/views/screens/inbox/InboxChatDesign';
import { V2DashboardWebView } from '@/views/components/webview/V2DashboardWebView';
import { mobileV2Service } from '@/models/services/mobileV2Service';
import { useAppSelector } from '@/hooks';
import { selectCurrentUserAccountId } from '@/viewmodels/store/auth/authSelectors';

type ChatScreenProps = NativeStackScreenProps<TabBarExcludedScreenParamList, 'ChatScreen'>;

const ChatScreen = (props: ChatScreenProps) => {
  const navigation = useNavigation();
  const { conversationId } = props.route.params;
  const accountId = useAppSelector(selectCurrentUserAccountId);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Tab' as never);
    }
  }, [navigation]);

  const fetchDescriptor = useCallback(async () => {
    if (!accountId) {
      throw new Error('No active account ID');
    }
    return mobileV2Service.getConversationDetailDescriptor(accountId, conversationId);
  }, [accountId, conversationId]);

  return (
    <V2DashboardWebView
      key={`${accountId}-${conversationId}`}
      fetchDescriptor={fetchDescriptor}
      screenType="chat"
      showBack={true}
      onBack={handleBack}
      fallbackComponent={
        <ChatScreenDesign
          conversationId={conversationId}
          onBack={handleBack}
        />
      }
    />
  );
};

export default ChatScreen;
