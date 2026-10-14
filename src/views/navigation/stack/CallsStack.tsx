import React, { useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CallsScreenDesign from '@/views/screens/calls/CallsScreenDesign';
import { V2DashboardWebView } from '@/views/components/webview/V2DashboardWebView';
import { mobileV2Service } from '@/models/services/mobileV2Service';
import { useAppSelector } from '@/hooks';
import { selectCurrentUserAccountId } from '@/viewmodels/store/auth/authSelectors';

export type CallsStackParamList = {
  CallsScreen: undefined;
};

const Stack = createNativeStackNavigator<CallsStackParamList>();

const CallsScreen = () => {
  const accountId = useAppSelector(selectCurrentUserAccountId);

  const fetchDescriptor = useCallback(async () => {
    if (!accountId) {
      throw new Error('No active account ID');
    }
    return mobileV2Service.getCallsDescriptor(accountId);
  }, [accountId]);

  if (!accountId) {
    return <CallsScreenDesign />;
  }

  return (
    <V2DashboardWebView
      key={accountId}
      fetchDescriptor={fetchDescriptor}
      screenType="calls"
      showBack={false}
      fallbackComponent={<CallsScreenDesign />}
    />
  );
};

export const CallsStack = () => {
  return (
    <Stack.Navigator initialRouteName="CallsScreen">
      <Stack.Screen options={{ headerShown: false }} name="CallsScreen" component={CallsScreen} />
    </Stack.Navigator>
  );
};
