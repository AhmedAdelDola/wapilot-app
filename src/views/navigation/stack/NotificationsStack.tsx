import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NotificationsScreen from '@/views/screens/notifications/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsScreen: undefined;
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsStack = () => {
  return (
    <Stack.Navigator initialRouteName="NotificationsScreen">
      <Stack.Screen
        options={{ headerShown: false }}
        name="NotificationsScreen"
        component={NotificationsScreen}
      />
    </Stack.Navigator>
  );
};
