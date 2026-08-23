import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsScreenDesign from '@/screens/settings/SettingsScreenDesign';
import {
  ProfileScreen,
  DarkModeScreen,
  ChangePasswordScreen,
  UpdateNotificationsScreen,
  ChangeWorkspaceScreen,
  ReportBugScreen,
} from '@/screens/settings/SettingsSubScreens';

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  ProfileScreen: undefined;
  DarkModeScreen: undefined;
  ChangePasswordScreen: undefined;
  UpdateNotificationsScreen: undefined;
  ChangeWorkspaceScreen: undefined;
  ReportBugScreen: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => {
  return (
    <Stack.Navigator initialRouteName="SettingsScreen">
      <Stack.Screen
        options={{ headerShown: false }}
        name="SettingsScreen"
        component={SettingsScreenDesign}
      />
      <Stack.Screen
        options={{ headerShown: false, animation: 'slide_from_right' }}
        name="ProfileScreen"
        component={ProfileScreen}
      />
      <Stack.Screen
        options={{ headerShown: false, animation: 'slide_from_right' }}
        name="DarkModeScreen"
        component={DarkModeScreen}
      />
      <Stack.Screen
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
      />
      <Stack.Screen
        options={{ headerShown: false, animation: 'slide_from_right' }}
        name="UpdateNotificationsScreen"
        component={UpdateNotificationsScreen}
      />
      <Stack.Screen
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
        name="ChangeWorkspaceScreen"
        component={ChangeWorkspaceScreen}
      />
      <Stack.Screen
        options={{ headerShown: false, animation: 'slide_from_right' }}
        name="ReportBugScreen"
        component={ReportBugScreen}
      />
    </Stack.Navigator>
  );
};
