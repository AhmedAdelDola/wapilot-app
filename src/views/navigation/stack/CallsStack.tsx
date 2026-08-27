import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CallsScreenDesign from '@/views/screens/calls/CallsScreenDesign';

export type CallsStackParamList = {
  CallsScreen: undefined;
};

const Stack = createNativeStackNavigator<CallsStackParamList>();

export const CallsStack = () => {
  return (
    <Stack.Navigator initialRouteName="CallsScreen">
      <Stack.Screen options={{ headerShown: false }} name="CallsScreen" component={CallsScreenDesign} />
    </Stack.Navigator>
  );
};
