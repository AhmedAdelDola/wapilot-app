import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import * as WebBrowser from 'expo-web-browser';
import ChatWootWidget from '@chatwoot/react-native-widget';
import { useSelector } from 'react-redux';
import * as Application from 'expo-application';

import { Account, AvailabilityStatus } from '@/types';
import { clearAllConversations } from '@/store/conversation/conversationSlice';
import { resetNotifications } from '@/store/notification/notificationSlice';
import { clearAllContacts } from '@/store/contact/contactSlice';
import { clearSearchResults } from '@/store/search/searchSlice';
import { RecentSearches } from '@/screens/search/utils/recentSearches';
import { HELP_URL } from '@/constants/url';
import { tailwind } from '@/theme';
import { UserHeader, SettingsSection, SettingsRow, Toggle } from '@/components-next';
import { TAB_BAR_HEIGHT } from '@/constants';
import { useHaptic } from '@/utils';
import {
  selectCurrentUserAvailability,
  selectUser,
  selectAccounts,
} from '@/store/auth/authSelectors';
import { logout, setAccount } from '@/store/auth/authSlice';
import { authActions } from '@/store/auth/authActions';
import {
  selectLocale,
  selectIsChatwootCloud,
  selectPushToken,
  selectTheme,
} from '@/store/settings/settingsSelectors';
import { settingsActions } from '@/store/settings/settingsActions';
import i18n from '@/i18n';
import AnalyticsHelper from '@/utils/analyticsUtils';
import { PROFILE_EVENTS } from '@/constants/analyticsEvents';
import { getUserPermissions } from '@/utils/permissionUtils';
import { CONVERSATION_PERMISSIONS } from '@/constants/permissions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { GetSupportSheet } from './components/GetSupportSheet';

const appName = Application.applicationName;
const appVersion = Application.nativeApplicationVersion;
const buildNumber = Application.nativeBuildVersion;
const appVersionDetails = buildNumber ? `${appVersion} (${buildNumber})` : appVersion;

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [showWidget, toggleWidget] = useState(false);
  const [showGetSupport, setShowGetSupport] = useState(false);

  const availabilityStatus =
    (useSelector(selectCurrentUserAvailability) as AvailabilityStatus) || 'offline';

  const user = useSelector(selectUser);
  const {
    name,
    email,
    avatar_url: avatarUrl,
    identifier_hash: identifierHash,
    account_id: activeAccountId,
  } = user || {};

  const pushToken = useAppSelector(selectPushToken);
  const currentTheme = useAppSelector(selectTheme);
  const isChatwootCloud = useAppSelector(selectIsChatwootCloud);
  const accounts = useSelector(selectAccounts) || [];
  const activeAccountName = accounts.length
    ? accounts.find((account: Account) => account.id === activeAccountId)?.name || ''
    : '';

  const userPermissions = getUserPermissions(user, activeAccountId);
  const hasConversationPermission = CONVERSATION_PERMISSIONS.some(permission =>
    userPermissions.includes(permission),
  );

  useEffect(() => {
    dispatch(settingsActions.getNotificationSettings());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(authActions.getProfile()).unwrap(),
        dispatch(settingsActions.getNotificationSettings()).unwrap(),
      ]);
    } catch {
      // errors handled by individual thunks
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const hapticSelection = useHaptic();

  const getThemeLabel = () => {
    switch (currentTheme) {
      case 'system':
        return 'Use system setting';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Off';
    }
  };

  const onClickLogout = useCallback(async () => {
    await AsyncStorage.removeItem('cwCookie');
    await RecentSearches.clearAll();
    await dispatch(settingsActions.removeDevice({ pushToken }));
    dispatch(logout());
  }, [dispatch, pushToken]);

  const userDetails = {
    identifier: email,
    name,
    avatar_url: avatarUrl,
    email,
    identifier_hash: identifierHash,
  };

  const customAttributes = {
    originatedFrom: 'mobile-app',
    appName,
    appVersion: appVersionDetails,
    deviceId: DeviceInfo.getDeviceId(),
    packageName: appName,
    operatingSystem: Platform.OS,
  };

  const chatwootInstance = isChatwootCloud ? `${appName} cloud` : `${appName} self-hosted`;

  return (
    <SafeAreaView style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT - 1}px]`)}
        bounces={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }>
        <Text style={tailwind.style('text-[28px] font-inter-580-24 text-gray-950 px-4 pt-4 pb-2')}>
          Settings
        </Text>

        <Pressable
          onPress={() => navigation.navigate('ProfileScreen' as never)}
          style={tailwind.style('flex-row items-center px-4 py-3')}>
          <UserHeader
            name={name || ''}
            email={email || ''}
            avatarUrl={avatarUrl}
            status={availabilityStatus as 'online' | 'away' | 'offline'}
          />
          <Text style={tailwind.style('text-gray-400 ml-2')}>›</Text>
        </Pressable>

        <SettingsSection title="General">
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>👤</Text>}
            title={`Set yourself as ${availabilityStatus === 'online' ? 'Available' : 'Busy'}`}
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>🏢</Text>}
            title="Change workspace"
            subtitle={activeAccountName}
            onPress={() => navigation.navigate('ChangeWorkspaceScreen' as never)}
            hasChevron
          />
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>🔔</Text>}
            title="Update notifications"
            onPress={() => navigation.navigate('UpdateNotificationsScreen' as never)}
            hasChevron
          />
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>🔑</Text>}
            title="Change password"
            onPress={() => navigation.navigate('ChangePasswordScreen' as never)}
            hasChevron
          />
        </SettingsSection>

        <SettingsSection title="App">
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>🌙</Text>}
            title="Dark mode"
            subtitle={getThemeLabel()}
            onPress={() => navigation.navigate('DarkModeScreen' as never)}
            hasChevron
          />
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>📳</Text>}
            title="Haptic feedback"
            rightElement={<Toggle value={true} onValueChange={() => {}} />}
            hasChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="Help & feedback">
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>⚠️</Text>}
            title="Report a bug"
            onPress={() => navigation.navigate('ReportBugScreen' as never)}
            hasChevron
          />
          <SettingsRow
            icon={<Text style={tailwind.style('text-xl')}>💬</Text>}
            title="Get support"
            onPress={() => setShowGetSupport(true)}
            hasChevron
          />
        </SettingsSection>

        <Pressable
          onPress={onClickLogout}
          style={tailwind.style('flex-row items-center px-6 py-4')}>
          <Text style={tailwind.style('text-xl mr-3')}>🚪</Text>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-950')}>
            Log out
          </Text>
        </Pressable>

        <Pressable
          style={tailwind.style('items-center py-4')}
          onLongPress={() => {}}>
          <Text style={tailwind.style('text-[12px] text-gray-500')}>
            Version {appVersionDetails}
          </Text>
        </Pressable>
      </ScrollView>

      {showGetSupport && (
        <View style={tailwind.style('absolute inset-0 bg-black/50 justify-end')}>
          <Pressable
            style={tailwind.style('flex-1')}
            onPress={() => setShowGetSupport(false)}
          />
          <GetSupportSheet onClose={() => setShowGetSupport(false)} />
        </View>
      )}

      {!!process.env.EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN &&
        !!process.env.EXPO_PUBLIC_CHATWOOT_BASE_URL &&
        !!showWidget && (
          <ChatWootWidget
            websiteToken={process.env.EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN}
            locale="en"
            baseUrl={process.env.EXPO_PUBLIC_CHATWOOT_BASE_URL}
            closeModal={() => toggleWidget(false)}
            isModalVisible={showWidget}
            user={userDetails}
            customAttributes={customAttributes}
          />
        )}
    </SafeAreaView>
  );
};

export default SettingsScreen;
