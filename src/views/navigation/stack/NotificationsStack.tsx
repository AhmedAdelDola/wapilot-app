import React, { useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NotificationsScreen from '@/views/screens/notifications/NotificationsScreen';
import { V2DashboardWebView } from '@/views/components/webview/V2DashboardWebView';
import { mobileV2Service } from '@/models/services/mobileV2Service';
import { useAppSelector } from '@/hooks';
import { selectCurrentUserAccountId } from '@/viewmodels/store/auth/authSelectors';

export type NotificationsStackParamList = {
  NotificationsScreen: undefined;
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

const NotificationsScreenWrapper = () => {
  const accountId = useAppSelector(selectCurrentUserAccountId);

  const fetchDescriptor = useCallback(async () => {
    if (!accountId) {
      throw new Error('No active account ID');
    }
    return mobileV2Service.getNotificationsDescriptor(accountId);
  }, [accountId]);

  if (!accountId) {
    return <NotificationsScreen />;
  }

  return (
    <V2DashboardWebView
      key={accountId}
      fetchDescriptor={fetchDescriptor}
      screenType="notifications"
      showBack={false}
      fallbackComponent={<NotificationsScreen />}
    />
  );
};

export const NotificationsStack = () => {
  return (
    <Stack.Navigator initialRouteName="NotificationsScreen">
      <Stack.Screen
        options={{ headerShown: false }}
        name="NotificationsScreen"
        component={NotificationsScreenWrapper}
      />
    </Stack.Navigator>
  );
};
