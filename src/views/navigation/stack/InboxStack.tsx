import React, { useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InboxChatDesign from '@/views/screens/inbox/InboxChatDesign';
import { V2DashboardWebView } from '@/views/components/webview/V2DashboardWebView';
import { mobileV2Service } from '@/models/services/mobileV2Service';
import { useAppSelector } from '@/hooks';
import { selectCurrentUserAccountId } from '@/viewmodels/store/auth/authSelectors';

export type InboxStackParamList = {
  InboxScreen: undefined;
};

const Stack = createNativeStackNavigator<InboxStackParamList>();

const InboxScreen = () => {
  const accountId = useAppSelector(selectCurrentUserAccountId);

  const fetchDescriptor = useCallback(async () => {
    if (!accountId) {
      throw new Error('No active account ID');
    }
    return mobileV2Service.getConversationsDescriptor(accountId);
  }, [accountId]);

  if (!accountId) {
    return <InboxChatDesign />;
  }

  return (
    <V2DashboardWebView
      key={accountId}
      fetchDescriptor={fetchDescriptor}
      screenType="conversations"
      showBack={false}
      fallbackComponent={<InboxChatDesign />}
    />
  );
};

export const InboxStack = () => {
  return (
    <Stack.Navigator initialRouteName="InboxScreen">
      <Stack.Screen options={{ headerShown: false }} name="InboxScreen" component={InboxScreen} />
    </Stack.Navigator>
  );
};
