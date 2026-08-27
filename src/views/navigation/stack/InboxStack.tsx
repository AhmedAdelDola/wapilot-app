import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InboxChatDesign from '@/views/screens/inbox/InboxChatDesign';

export type InboxStackParamList = {
  InboxScreen: undefined;
};

const Stack = createNativeStackNavigator<InboxStackParamList>();

export const InboxStack = () => {
  return (
    <Stack.Navigator initialRouteName="InboxScreen">
      <Stack.Screen options={{ headerShown: false }} name="InboxScreen" component={InboxChatDesign} />
    </Stack.Navigator>
  );
};
