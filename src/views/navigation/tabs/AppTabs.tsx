import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { authActions } from '@/viewmodels/store/auth/authActions';
import * as Sentry from '@sentry/react-native';

import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  selectLoggedIn,
  selectUser,
  selectCurrentUserAccount,
  selectPubSubToken,
  selectUserId,
  selectCurrentUserAccountId,
  selectAuthHeaders,
} from '@/viewmodels/store/auth/authSelectors';
import { selectWebSocketUrl } from '@/viewmodels/store/settings/settingsSelectors';

import { getUserPermissions } from '@/utils/permissionUtils';
import { CONVERSATION_PERMISSIONS } from 'constants/permissions';

import { AuthStack, SettingsStack, InboxStack, CallsStack, NotificationsStack } from '../stack';
import ChatScreen from '@/views/screens/chat-screen/ChatScreen';
import ContactDetailsScreen from '@/views/screens/contact-details/ContactDetailsScreen';
import DashboardScreen from '@/views/screens/dashboard/DashboardScreen';
import SearchScreen from '@/views/screens/search/SearchScreen';

import { selectInstallationUrl } from '@/viewmodels/store/settings/settingsSelectors';
import { BottomTabBar } from './BottomTabBar';
import { settingsActions } from '@/viewmodels/store/settings/settingsActions';
import { selectChatwootVersion } from '@/viewmodels/store/settings/settingsSelectors';
import { checkServerSupport } from '@/utils/serverUtils';
import { inboxActions } from '@/viewmodels/store/inbox/inboxActions';
import { labelActions } from '@/viewmodels/store/label/labelActions';
import actionCableConnector from '@/utils/actionCable';
import { setCurrentState } from '@/viewmodels/store/conversation/conversationHeaderSlice';
import AnalyticsHelper from '@/utils/analyticsUtils';
import { clearAllDeliveredNotifications } from '@/utils/pushUtils';
import { dashboardAppActions } from '@/viewmodels/store/dashboard-app/dashboardAppActions';
import { customAttributeActions } from '@/viewmodels/store/custom-attribute/customAttributeActions';
import { clearSelection } from '@/viewmodels/store/conversation/conversationSelectedSlice';
import { apiService } from '@/models/services/APIService';
import { config } from '@/config';
import { getAuthHeaders } from '@/utils/secureStore';
import { updateAuthHeaders } from '@/viewmodels/store/auth/authSlice';

const Tab = createBottomTabNavigator();

export type TabParamList = {
  Notifications: undefined;
  Inbox: undefined;
  Calls: undefined;
  Settings: undefined;
  Login: undefined;
  ConfigInstallationURL: undefined;
  ForgotPassword: undefined;
  Search: undefined;
};

export type TabBarExcludedScreenParamList = {
  Tab: undefined;
  ChatScreen: {
    conversationId: number;
    primaryActorId?: number;
    primaryActorType?: string;
    messageId?: number;
  };
  ContactDetails: { conversationId?: number; contactId?: number };
  ConversationActions: undefined;
  Dashboard: { url: string };
  Login: undefined;
  SearchScreen: undefined;
  ImageScreen: undefined;
  ConversationDetails: undefined;
  ConversationAction: undefined;
};
const Stack = createNativeStackNavigator<TabBarExcludedScreenParamList>();

const CustomTabBar = (props: BottomTabBarProps) => <BottomTabBar {...props} />;

const Tabs = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const installationUrl = useAppSelector(selectInstallationUrl);
  const chatwootVersion = useAppSelector(selectChatwootVersion);
  const currentAccount = useAppSelector(selectCurrentUserAccount);
  const currentAccountRole = currentAccount?.role;
  const pubSubToken = useAppSelector(selectPubSubToken);
  const userId = useAppSelector(selectUserId);
  const accountId = useAppSelector(selectCurrentUserAccountId);
  const webSocketUrl = useAppSelector(selectWebSocketUrl);

  // Derive WebSocket URL from config base URL (persisted values may be stale)
  const correctWebSocketUrl = (() => {
    const host = config.chatwoot.baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `wss://${host}/cable`;
  })();
  const authHeaders = useAppSelector(selectAuthHeaders);

  useEffect(() => {
    // Initialize apiService from persisted state or SecureStore
    if (authHeaders) {
      apiService.setAuthHeaders(authHeaders);
    } else {
      getAuthHeaders().then(stored => {
        if (stored) {
          apiService.setAuthHeaders(stored);
          dispatch(updateAuthHeaders(stored));
        }
      });
    }
    if (accountId) {
      apiService.setAccountId(accountId);
    }
  }, [authHeaders, accountId, dispatch]);

  useEffect(() => {
    if (accountId) {
      apiService.setAccountId(accountId);
    }
    // Here is the place we are loading all the data for the app first time or user switches account
    dispatch(authActions.getProfile()).then((result: any) => {
      const activeAccId = result.payload?.account_id || accountId;
      if (activeAccId) {
        apiService.setAccountId(activeAccId);
      }
      dispatch(inboxActions.fetchInboxes());
      dispatch(labelActions.fetchLabels());
      dispatch(dashboardAppActions.index());
      dispatch(customAttributeActions.index());
    });
    dispatch(settingsActions.saveDeviceDetails());
    dispatch(setCurrentState('none'));
    dispatch(clearSelection());
    initAnalytics();
    initSentry();
    initPushNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Initialize ActionCable when user data becomes available
  useEffect(() => {
    initActionCable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubSubToken, correctWebSocketUrl, accountId, userId]);

  const initAnalytics = useCallback(async () => {
    if (user) {
      AnalyticsHelper.identify(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initPushNotifications = useCallback(async () => {
    clearAllDeliveredNotifications();
  }, []);

  const initSentry = useCallback(async () => {
    Sentry.setUser({
      id: user?.id,
      email: user?.email,
      account_id: user?.account_id,
      name: user?.name,
      role: user?.role,
      installation_url: installationUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initActionCable = useCallback(async () => {
    if (pubSubToken && correctWebSocketUrl && accountId && userId) {
      actionCableConnector.init({ pubSubToken, webSocketUrl: correctWebSocketUrl, accountId, userId });
    }
  }, [accountId, pubSubToken, userId, correctWebSocketUrl]);

  useEffect(() => {
    dispatch(settingsActions.getChatwootVersion({ installationUrl: installationUrl }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationUrl]);

  const userPermissions = user ? getUserPermissions(user, user.account_id) : [];

  // Checking if user has conversation permission to show inbox and conversations tabs
  const hasConversationPermission = CONVERSATION_PERMISSIONS.some(permission =>
    userPermissions.includes(permission),
  );

  const checkAppVersion = useCallback(async () => {
    if (chatwootVersion) {
      checkServerSupport({
        installedVersion: chatwootVersion,
        userRole: currentAccountRole,
      });
    }
  }, [chatwootVersion, currentAccountRole]);

  useEffect(() => {
    checkAppVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tab.Navigator tabBar={CustomTabBar} initialRouteName="Inbox">
      <Tab.Screen name="Notifications" component={NotificationsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Inbox" component={InboxStack} options={{ headerShown: false }} />
      <Tab.Screen name="Calls" component={CallsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" options={{ headerShown: false }} component={SettingsStack} />
    </Tab.Navigator>
  );
};

export const AppTabs = () => {
  const isLoggedIn = useAppSelector(selectLoggedIn);

  if (isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tab" component={Tabs} />
        <Stack.Screen
          options={{ animation: 'slide_from_right' }}
          name="ChatScreen"
          component={ChatScreen}
        />
        <Stack.Screen
          options={{
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
            animation: 'slide_from_bottom',
          }}
          name="ContactDetails"
          component={ContactDetailsScreen}
        />
        <Stack.Screen
          options={{
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
            animation: 'slide_from_bottom',
          }}
          name="Dashboard"
          component={DashboardScreen}
        />
        <Stack.Screen
          options={{ headerShown: false, animation: 'slide_from_right' }}
          name="SearchScreen"
          component={SearchScreen}
        />
      </Stack.Navigator>
    );
  } else {
    return <AuthStack />;
  }
};
