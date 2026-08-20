import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsScreen from '@/screens/settings/SettingsScreen';
import ProfileScreen from '@/screens/settings/ProfileScreen';
import DarkModeScreen from '@/screens/settings/DarkModeScreen';
import ChangePasswordScreen from '@/screens/settings/ChangePasswordScreen';
import UpdateNotificationsScreen from '@/screens/settings/UpdateNotificationsScreen';
import ChangeWorkspaceScreen from '@/screens/settings/ChangeWorkspaceScreen';
import ReportBugScreen from '@/screens/settings/ReportBugScreen';

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
        component={SettingsScreen}
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
