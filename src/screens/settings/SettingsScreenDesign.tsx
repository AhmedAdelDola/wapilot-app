import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  selectCurrentUserAvailability,
  selectUser,
  selectAccounts,
} from '@/store/auth/authSelectors';
import { logout, setCurrentUserAvailability } from '@/store/auth/authSlice';
import { authActions } from '@/store/auth/authActions';
import {
  selectPushToken,
  selectTheme,
} from '@/store/settings/settingsSelectors';
import { settingsActions } from '@/store/settings/settingsActions';
import { RecentSearches } from '@/screens/search/utils/recentSearches';
import { Account, AvailabilityStatus } from '@/types';
import { useHaptic } from '@/utils';
import { useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { showToast } from '@/utils/toastUtils';

// ---------- Icons ----------
const ChevronRight = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const WorkspaceIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
    <Path d="M9 9h6M9 12h6M9 15h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const BellIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const MoonIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIconSm = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.8" />
    <Path d="M9 18h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const AlertIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const ChatIcon = ({ color = '#94a3b8' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------- Toggle ----------
const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <Pressable
    onPress={onToggle}
    style={{
      width: 48,
      height: 24,
      borderRadius: 999,
      backgroundColor: on ? '#3b82f6' : '#d1d5db',
      justifyContent: 'center',
      paddingHorizontal: 2,
    }}>
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 999,
        backgroundColor: 'white',
        alignSelf: on ? 'flex-end' : 'flex-start',
      }}
    />
  </Pressable>
);

const iconBox = { width: 32, height: 32, alignItems: 'center' as const, justifyContent: 'center' as const };
const rowCls = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingVertical: 16,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#f3f4f6',
};

// ---------- Settings Screen (reference-exact with full API integration) ----------
const SettingsScreenDesign = () => {
  const [haptic, setHaptic] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const hapticTrigger = useHaptic();
  const { isDark, themeSetting } = useTheme();

  // Dynamic theme colors
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';
  const iconBg = isDark ? '#1e293b' : '#f3f4f6';

  const dynamicRowCls = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  };

  const dynamicIconBox = {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: iconBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  // Redux state
  const user = useAppSelector(selectUser);
  const { name, email, avatar_url: avatarUrl, account_id: activeAccountId } = user || {};
  const rawAvailabilitySelector = useAppSelector(selectCurrentUserAvailability);
  const accounts = useAppSelector(selectAccounts) || [];
  const currentAccount = accounts.find((account: Account) => Number(account.id) === Number(activeAccountId));

  const [localAvailability, setLocalAvailability] = useState<string | null>(null);

  const rawAvailability =
    localAvailability ||
    currentAccount?.availability ||
    (currentAccount as any)?.availability_status ||
    (user as any)?.availability ||
    (user as any)?.availability_status ||
    rawAvailabilitySelector ||
    'offline';

  const isOnline = rawAvailability === 'online';
  const targetStatusText = isOnline ? 'Busy' : 'Available';
  const currentStatusText = isOnline ? 'Available' : 'Busy';

  const pushToken = useAppSelector(selectPushToken);
  const activeAccountName = currentAccount?.name || 'My Workspace';

  const appVersion = Application.nativeApplicationVersion || '3.3.0';
  const buildNumber = Application.nativeBuildVersion;
  const appVersionDetails = buildNumber ? `Version ${appVersion} (${buildNumber})` : `Version ${appVersion}`;

  useEffect(() => {
    dispatch(settingsActions.getNotificationSettings());
    AsyncStorage.getItem('haptic_enabled').then(val => {
      if (val !== null) {
        setHaptic(val === 'true');
      }
    });
  }, [dispatch]);

  const handleToggleHaptic = async (newVal: boolean) => {
    setHaptic(newVal);
    if (newVal) {
      hapticTrigger?.();
    }
    await AsyncStorage.setItem('haptic_enabled', newVal ? 'true' : 'false');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(authActions.getProfile()).unwrap(),
        dispatch(settingsActions.getNotificationSettings()).unwrap(),
      ]);
      setLocalAvailability(null);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const toggleAvailability = async () => {
    if (updatingAvailability || !activeAccountId) return;
    const targetStatus: AvailabilityStatus = isOnline ? 'offline' : 'online';
    const targetLabel = targetStatus === 'online' ? 'Available' : 'Busy';

    setLocalAvailability(targetStatus);
    hapticTrigger?.();
    setUpdatingAvailability(true);

    if (user?.id) {
      dispatch(setCurrentUserAvailability({
        users: { [user.id]: targetStatus },
      }));
    }

    try {
      await dispatch(
        authActions.updateAvailability({
          profile: {
            availability: targetStatus,
            account_id: String(activeAccountId),
          },
        }),
      ).unwrap();
      showToast({ message: `You are now ${targetLabel}` });
      await dispatch(authActions.getProfile()).unwrap();
    } catch (e) {
      console.log('Error updating availability via thunk:', e);
      try {
        await profileService.setAvailability(Number(activeAccountId), targetStatus);
        showToast({ message: `You are now ${targetLabel}` });
        await dispatch(authActions.getProfile()).unwrap();
      } catch (err) {
        console.log('Error updating availability via profileService:', err);
        showToast({ message: 'Failed to update status' });
        setLocalAvailability(null);
      }
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const getThemeLabel = () => {
    switch (themeSetting) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Off';
    }
  };

  const onClickLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('cwCookie');
          await RecentSearches.clearAll();
          if (pushToken) {
            await dispatch(settingsActions.removeDevice({ pushToken }));
          }
          dispatch(logout());
        },
      },
    ]);
  };

  const initialLetter = (name || email || 'U')[0].toUpperCase();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar translucent backgroundColor={bgColor} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: textPrimary }}>Settings</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}>
          {/* Profile */}
          <Pressable style={dynamicRowCls} onPress={() => navigation.navigate('ProfileScreen')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  position: 'relative',
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: isOnline ? '#22c55e' : '#f59e0b',
                  padding: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 999 }} />
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: '#14b8a6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{initialLetter}</Text>
                  </View>
                )}
                {/* Status circle on avatar */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 15,
                    height: 15,
                    borderRadius: 999,
                    backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
                    borderWidth: 2.5,
                    borderColor: isDark ? '#0f172a' : 'white',
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: textPrimary, flexShrink: 1 }}>{name || 'User'}</Text>
                <Text style={{ fontSize: 14, color: textSecondary, flexShrink: 1 }}>{email || ''}</Text>
              </View>
            </View>
            <ChevronRight />
          </Pressable>

          {/* General */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#64748b' : '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
                paddingTop: 20,
                paddingBottom: 8,
              }}>
              General
            </Text>
            <Pressable
              style={[dynamicRowCls, { paddingHorizontal: 0 }]}
              onPress={toggleAvailability}
              disabled={updatingAvailability}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={dynamicIconBox}>
                  <UserIcon />
                </View>
                <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '500' }}>
                  {`Set yourself as `}
                  <Text style={{ fontWeight: '700', color: isOnline ? '#d97706' : '#059669' }}>
                    {targetStatusText}
                  </Text>
                </Text>
              </View>
              {updatingAvailability && (
                <ActivityIndicator size="small" color={isOnline ? '#d97706' : '#059669'} />
              )}
            </Pressable>
          </View>

          {/* Account */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#64748b' : '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
                paddingTop: 20,
                paddingBottom: 8,
              }}>
              Account
            </Text>
            {[
              {
                icon: <WorkspaceIcon />,
                label: 'Change workspace',
                sub: activeAccountName,
                action: () => navigation.navigate('ChangeWorkspaceScreen'),
              },
              {
                icon: <BellIcon />,
                label: 'Update notifications',
                sub: null,
                action: () => navigation.navigate('UpdateNotificationsScreen'),
              },
              {
                icon: <LockIcon />,
                label: 'Change password',
                sub: null,
                action: () => navigation.navigate('ChangePasswordScreen'),
              },
            ].map((item, i) => (
              <Pressable key={i} style={[dynamicRowCls, { paddingHorizontal: 0 }]} onPress={item.action}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={dynamicIconBox}>{item.icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textPrimary, flexShrink: 1 }}>{item.label}</Text>
                    {item.sub && <Text style={{ fontSize: 14, color: textSecondary }}>{item.sub}</Text>}
                  </View>
                </View>
                <ChevronRight />
              </Pressable>
            ))}
          </View>

          {/* App */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#64748b' : '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
                paddingTop: 20,
                paddingBottom: 8,
              }}>
              App
            </Text>
            <Pressable style={[dynamicRowCls, { paddingHorizontal: 0 }]} onPress={() => navigation.navigate('DarkModeScreen')}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={dynamicIconBox}>
                  <MoonIcon />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textPrimary }}>Dark mode</Text>
                  <Text style={{ fontSize: 14, color: textSecondary }}>{getThemeLabel()}</Text>
                </View>
              </View>
              <ChevronRight />
            </Pressable>
            <View style={[dynamicRowCls, { paddingHorizontal: 0 }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={dynamicIconBox}>
                  <PhoneIconSm />
                </View>
                <Text style={{ color: textPrimary }}>Haptic feedback</Text>
              </View>
              <Toggle
                on={haptic}
                onToggle={() => handleToggleHaptic(!haptic)}
              />
            </View>
          </View>

          {/* Help & feedback */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#64748b' : '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
                paddingTop: 20,
                paddingBottom: 8,
              }}>
              Help & feedback
            </Text>
            {[
              { icon: <AlertIcon />, label: 'Report a bug', action: () => navigation.navigate('ReportBugScreen') },
              { icon: <ChatIcon />, label: 'Get support', action: () => setShowSupportSheet(true) },
            ].map((item, i) => (
              <Pressable key={i} style={[dynamicRowCls, { paddingHorizontal: 0 }]} onPress={item.action}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={dynamicIconBox}>{item.icon}</View>
                  <Text style={{ color: textPrimary, flexShrink: 1, flex: 1 }}>{item.label}</Text>
                </View>
                <ChevronRight />
              </Pressable>
            ))}
          </View>

          {/* Log out */}
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Pressable style={[dynamicRowCls, { paddingHorizontal: 0 }]} onPress={onClickLogout}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={dynamicIconBox}>
                  <LogoutIcon />
                </View>
                <Text style={{ color: '#ef4444', fontWeight: '500', flex: 1 }}>Log out</Text>
              </View>
              <ChevronRight />
            </Pressable>
          </View>

          {/* Footer App Version */}
          <View style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 16 }}>
            <Text style={{ fontSize: 13, color: isDark ? '#64748b' : '#9ca3af' }}>{appVersionDetails}</Text>
          </View>
        </ScrollView>

        {showSupportSheet && <GetSupportSheetLocal onClose={() => setShowSupportSheet(false)} />}
      </View>
    </SafeAreaView>
  );
};

// ---------- Get Support Sheet (reference-exact with WhatsApp integration) ----------
const GetSupportSheetLocal = ({ onClose }: { onClose: () => void }) => {
  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/201026047788').catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp');
    });
  };

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={onClose}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 40,
        }}
        onStartShouldSetResponder={() => true}>
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: '#d1d5db',
            borderRadius: 999,
            alignSelf: 'center',
            marginTop: 12,
            marginBottom: 16,
          }}
        />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }}>
          Get Support
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
          Chat with us on WhatsApp
        </Text>
        <Pressable
          onPress={handleOpenWhatsApp}
          style={{
            marginHorizontal: 24,
            backgroundColor: '#25D366',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Open WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default SettingsScreenDesign;

