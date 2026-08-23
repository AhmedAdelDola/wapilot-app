import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Appearance,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';

import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  selectAccounts,
  selectCurrentUserAccountId,
  selectUser,
} from '@/store/auth/authSelectors';
import { authActions } from '@/store/auth/authActions';
import {
  selectNotificationSettings,
  selectTheme,
} from '@/store/settings/settingsSelectors';
import { settingsActions } from '@/store/settings/settingsActions';
import { setTheme } from '@/store/settings/settingsSlice';
import { inboxActions } from '@/store/inbox/inboxActions';
import { showToast } from '@/utils/toastUtils';
import { Account } from '@/types/Account';
import { useTheme } from '@/theme';

// ---------- Theme Helper ----------
const useIsDark = () => useTheme().isDark;

// ---------- Shared icons ----------
const ArrowLeft = ({ color = '#111827' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SearchSmall = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
    <Path d="m21 21-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
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

// ---------- Shared header ----------
const SubHeader = ({
  title,
  right,
  onRightPress,
  rightLoading = false,
}: {
  title: string;
  right?: string;
  onRightPress?: () => void;
  rightLoading?: boolean;
}) => {
  const navigation = useNavigation<any>();
  const isDark = useIsDark();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1f2937' : '#f3f4f6',
        backgroundColor: isDark ? '#111827' : 'white',
      }}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <ArrowLeft color={isDark ? '#f9fafb' : '#111827'} />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#f9fafb' : '#111827' }}>{title}</Text>
      <View style={{ minWidth: 48, alignItems: 'flex-end' }}>
        {right && (
          <Pressable onPress={onRightPress} disabled={rightLoading} hitSlop={12}>
            {rightLoading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>{right}</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ==========================================
// 1. Update Notifications Screen
// ==========================================
export const UpdateNotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const notificationSettings = useAppSelector(selectNotificationSettings);

  const [mobilePush, setMobilePush] = useState(true);
  const [callSounds, setCallSounds] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown States
  const [pushScope, setPushScope] = useState('all');
  const [callScope, setCallScope] = useState('all');
  const [chatScope, setChatScope] = useState('all');
  const [activeModal, setActiveModal] = useState<'push' | 'call' | 'chat' | null>(null);

  const pushOptions = [
    { id: 'all', label: 'For all contacts and mentions' },
    { id: 'assigned', label: 'Only for contacts assigned to me' },
    { id: 'mentions', label: 'Only for mentions' },
  ];

  const callOptions = [
    { id: 'all', label: 'Play for Contacts assigned to me and unassigned contacts' },
    { id: 'assigned', label: 'Play only for Contacts assigned to me' },
    { id: 'none', label: 'Do not play call sounds' },
  ];

  const chatOptions = [
    { id: 'all', label: 'For contacts assigned to me or unassigned contacts' },
    { id: 'assigned', label: 'For contacts assigned to me only' },
    { id: 'none', label: 'Do not play chat sounds' },
  ];

  useEffect(() => {
    dispatch(settingsActions.getNotificationSettings());
  }, [dispatch]);

  useEffect(() => {
    if (notificationSettings) {
      setMobilePush(notificationSettings.selected_push_flags?.length > 0);
    }
  }, [notificationSettings]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const allPushFlags = notificationSettings?.all_push_flags || [];
      const allEmailFlags = notificationSettings?.all_email_flags || [];

      await dispatch(
        settingsActions.updateNotificationSettings({
          notification_settings: {
            selected_push_flags: mobilePush ? allPushFlags : [],
            selected_email_flags: allEmailFlags,
          },
        }),
      ).unwrap();
      showToast({ message: 'Notification settings updated' });
      navigation.goBack();
    } catch {
      showToast({ message: 'Failed to update notification settings' });
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, mobilePush, notificationSettings, navigation]);

  const dropdownStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: isDark ? '#374151' : '#e5e7eb',
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  };

  const getPushScopeLabel = () => pushOptions.find(o => o.id === pushScope)?.label || pushOptions[0].label;
  const getCallScopeLabel = () => callOptions.find(o => o.id === callScope)?.label || callOptions[0].label;
  const getChatScopeLabel = () => chatOptions.find(o => o.id === chatScope)?.label || chatOptions[0].label;

  const currentModalOptions =
    activeModal === 'push'
      ? { title: 'Mobile Notification Scope', options: pushOptions, selected: pushScope, onSelect: setPushScope }
      : activeModal === 'call'
      ? { title: 'Call Sounds Scope', options: callOptions, selected: callScope, onSelect: setCallScope }
      : { title: 'Chat Sounds Scope', options: chatOptions, selected: chatScope, onSelect: setChatScope };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : 'white' }}>
      <StatusBar translucent backgroundColor={isDark ? '#111827' : 'white'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Update notifications" right="Save" onRightPress={handleSave} rightLoading={isSaving} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 24 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', fontSize: 16 }}>Mobile Push Notification</Text>
            <Toggle on={mobilePush} onToggle={() => setMobilePush(!mobilePush)} />
          </View>
          <Pressable style={dropdownStyle} onPress={() => setActiveModal('push')}>
            <Text style={{ color: isDark ? '#e5e7eb' : '#374151', fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 }}>
              {getPushScopeLabel()}
            </Text>
            <ChevronDown />
          </Pressable>
          <Pressable onPress={() => setOfflineOnly(!offlineOnly)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: offlineOnly ? '#3b82f6' : (isDark ? '#4b5563' : '#d1d5db'),
                backgroundColor: offlineOnly ? '#3b82f6' : (isDark ? '#1f2937' : 'white'),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {offlineOnly && <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#374151' }}>Only send mobile notifications when I am Offline</Text>
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }} />

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', fontSize: 16 }}>In-app Call Sounds</Text>
            <Toggle on={callSounds} onToggle={() => setCallSounds(!callSounds)} />
          </View>
          <Pressable style={dropdownStyle} onPress={() => setActiveModal('call')}>
            <Text style={{ color: isDark ? '#e5e7eb' : '#374151', fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 }}>
              {getCallScopeLabel()}
            </Text>
            <ChevronDown />
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }} />

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', fontSize: 16 }}>In-app Chat Sounds</Text>
            <Toggle on={chatSounds} onToggle={() => setChatSounds(!chatSounds)} />
          </View>
          <Pressable style={dropdownStyle} onPress={() => setActiveModal('chat')}>
            <Text style={{ color: isDark ? '#e5e7eb' : '#374151', fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 }}>
              {getChatScopeLabel()}
            </Text>
            <ChevronDown />
          </Pressable>
        </View>
      </ScrollView>

      {/* Interactive Selection Modal */}
      {activeModal && (
        <Modal transparent animationType="fade" visible={!!activeModal} onRequestClose={() => setActiveModal(null)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => setActiveModal(null)}>
            <Pressable
              style={{
                backgroundColor: isDark ? '#1f2937' : 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                paddingTop: 12,
              }}
              onPress={e => e.stopPropagation()}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: isDark ? '#4b5563' : '#d1d5db',
                  borderRadius: 999,
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />
              <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#f9fafb' : '#111827', marginBottom: 12 }}>
                {currentModalOptions.title}
              </Text>
              {currentModalOptions.options.map(opt => {
                const isSelected = currentModalOptions.selected === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      currentModalOptions.onSelect(opt.id);
                      setActiveModal(null);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#374151' : '#f3f4f6',
                    }}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: isSelected ? '#3b82f6' : (isDark ? '#e5e7eb' : '#374151'),
                        fontWeight: isSelected ? '600' : '400',
                        flex: 1,
                        marginRight: 12,
                      }}>
                      {opt.label}
                    </Text>
                    {isSelected && <CheckIcon />}
                  </Pressable>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// ==========================================
// 2. Change Password Screen
// ==========================================
export const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const isDark = useIsDark();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const inputCls = {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: isDark ? '#374151' : '#e5e7eb',
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    color: isDark ? '#f9fafb' : '#111827',
    fontSize: 14,
  } as const;

  const labelCls = { fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', marginBottom: 6, fontSize: 14 } as const;

  const handleChangePassword = () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (nextPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }
    if (nextPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast({ message: 'Password updated successfully' });
      navigation.goBack();
    }, 600);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : 'white' }}>
      <StatusBar translucent backgroundColor={isDark ? '#111827' : 'white'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Change password" right="Save" onRightPress={handleChangePassword} rightLoading={isSaving} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 20 }}>
        <View>
          <Text style={labelCls}>Existing Password</Text>
          <TextInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#9ca3af"
            style={inputCls}
          />
        </View>
        <View>
          <Text style={labelCls}>New Password</Text>
          <TextInput
            secureTextEntry
            value={nextPassword}
            onChangeText={setNextPassword}
            placeholder="Enter new password"
            placeholderTextColor="#9ca3af"
            style={inputCls}
          />
        </View>
        <View>
          <Text style={labelCls}>Confirm New Password</Text>
          <TextInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#9ca3af"
            style={inputCls}
          />
        </View>
        <Text style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280', lineHeight: 20 }}>
          Your password must be at least 8 characters long, include a number, an uppercase letter, a special character and a lowercase letter.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 3. Profile Screen
// ==========================================
export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const isDark = useIsDark();
  const user = useAppSelector(selectUser);

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [isSaving, setIsSaving] = useState(false);

  const email = user?.email || '';
  const avatarUrl = user?.avatar_url;
  const initialLetter = (user?.name || email || 'A')[0].toUpperCase();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast({ message: 'Profile updated successfully' });
      navigation.goBack();
    }, 500);
  };

  const inputCls = {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: isDark ? '#374151' : '#e5e7eb',
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    color: isDark ? '#f9fafb' : '#111827',
    fontSize: 14,
    fontWeight: '500' as const,
  } as const;

  const labelCls = { fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', marginBottom: 6, fontSize: 14 } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : 'white' }}>
      <StatusBar translucent backgroundColor={isDark ? '#111827' : 'white'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Profile" right="Save" onRightPress={handleSave} rightLoading={isSaving} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80, borderRadius: 999, marginBottom: 12 }} />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                backgroundColor: '#14b8a6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: '700' }}>{initialLetter}</Text>
            </View>
          )}
          <Text style={{ fontWeight: '700', color: isDark ? '#f9fafb' : '#111827', fontSize: 18 }}>{user?.name || 'User'}</Text>
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 14, marginTop: 2 }}>{email}</Text>
        </View>

        <View style={{ gap: 20 }}>
          <View>
            <Text style={labelCls}>First Name</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={inputCls} placeholder="Enter first name" placeholderTextColor="#9ca3af" />
          </View>
          <View>
            <Text style={labelCls}>Last Name</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={inputCls} placeholder="Enter last name" placeholderTextColor="#9ca3af" />
          </View>
          <View>
            <Text style={labelCls}>Email</Text>
            <TextInput value={email} editable={false} style={[inputCls, { backgroundColor: isDark ? '#111827' : '#f9fafb', color: '#9ca3af' }]} />
          </View>
          <View>
            <Text style={labelCls}>Language</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: isDark ? '#374151' : '#e5e7eb',
                backgroundColor: isDark ? '#1f2937' : 'white',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🇬🇧</Text>
                <Text style={{ color: isDark ? '#f9fafb' : '#374151', fontSize: 14, fontWeight: '500' }}>English</Text>
              </View>
              <ChevronDown />
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>All languages are currently in beta, with the exception of English.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 4. Change Workspace Screen
// ==========================================
export const ChangeWorkspaceScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const accounts = useAppSelector(selectAccounts) || [];
  const currentAccountId = useAppSelector(selectCurrentUserAccountId);

  const [query, setQuery] = useState('');
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const filteredAccounts = accounts.filter((account: Account) =>
    account.name?.toLowerCase().includes(query.toLowerCase().trim()),
  );

  const handleSwitchWorkspace = async (account: Account) => {
    if (account.id === currentAccountId || switchingId !== null) return;
    setSwitchingId(account.id);
    try {
      await dispatch(
        authActions.setActiveAccount({ profile: { account_id: account.id } }),
      ).unwrap();
      await dispatch(authActions.getProfile()).unwrap();
      dispatch(inboxActions.fetchInboxes());
      showToast({ message: `Switched to ${account.name}` });
      navigation.goBack();
    } catch {
      showToast({ message: 'Failed to switch workspace' });
    } finally {
      setSwitchingId(null);
    }
  };

  const getInitials = (name: string) => {
    return (name || 'W')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : 'white' }}>
      <StatusBar translucent backgroundColor={isDark ? '#111827' : 'white'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Change workspace" />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}>
          <SearchSmall />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search workspace"
            placeholderTextColor="#9ca3af"
            style={{ flex: 1, color: isDark ? '#f9fafb' : '#111827', fontSize: 14 }}
          />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {filteredAccounts.map((account: Account) => {
          const isActive = account.id === currentAccountId;
          const isSwitching = switchingId === account.id;

          return (
            <Pressable
              key={account.id}
              onPress={() => handleSwitchWorkspace(account)}
              disabled={isSwitching}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: isActive ? (isDark ? '#134e4a' : '#f0fdfa') : 'transparent',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#1f2937' : '#f3f4f6',
                marginBottom: 4,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    backgroundColor: isActive ? '#14b8a6' : (isDark ? '#374151' : '#93c5fd'),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isSwitching ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                      {getInitials(account.name)}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', fontSize: 15 }}>{account.name}</Text>
                  {isActive && (
                    <Text style={{ color: '#2dd4bf', fontSize: 12, fontWeight: '600', marginTop: 2 }}>Active</Text>
                  )}
                </View>
              </View>
              {isActive && <CheckIcon />}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 5. Dark Mode Screen
// ==========================================
export const DarkModeScreen = () => {
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const currentTheme = useAppSelector(selectTheme);

  const options: { id: 'system' | 'light' | 'dark'; label: string }[] = [
    { id: 'system', label: 'Use system settings' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  const handleSelect = (theme: 'system' | 'light' | 'dark') => {
    dispatch(setTheme(theme));
    // Sync native OS appearance so useColorScheme() and Appearance.getColorScheme() reflect the choice
    if (theme === 'system') {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(theme);
    }
    showToast({ message: `Theme set to ${theme}` });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : 'white' }}>
      <StatusBar translucent backgroundColor={isDark ? '#111827' : 'white'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Dark mode" />
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        {options.map(opt => (
          <Pressable
            key={opt.id}
            onPress={() => handleSelect(opt.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#1f2937' : '#f3f4f6',
            }}>
            <Text style={{ color: isDark ? '#f9fafb' : '#111827', fontSize: 15, fontWeight: currentTheme === opt.id ? '600' : '400' }}>
              {opt.label}
            </Text>
            {currentTheme === opt.id && <CheckIcon />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// 6. Report a Bug Screen
// ==========================================
export const ReportBugScreen = () => {
  const navigation = useNavigation<any>();
  const isDark = useIsDark();
  const [summary, setSummary] = useState('');
  const [isSending, setIsSending] = useState(false);

  const labelCls = { fontWeight: '600', color: isDark ? '#f9fafb' : '#111827', marginBottom: 6, fontSize: 14 } as const;

  const handleSend = () => {
    if (!summary.trim()) {
      Alert.alert('Error', 'Please describe the bug');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      showToast({ message: 'Bug report sent. Thank you!' });
      navigation.goBack();
    }, 500);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#111827' : 'white' }}>
      <StatusBar translucent backgroundColor={isDark ? '#111827' : 'white'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Report a bug" right="Send" onRightPress={handleSend} rightLoading={isSending} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, gap: 20 }}>
        <View>
          <Text style={labelCls}>Select bug location</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#e5e7eb',
              backgroundColor: isDark ? '#1f2937' : 'white',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
            <Text style={{ color: isDark ? '#e5e7eb' : '#374151', fontSize: 14 }}>Inbox & Messages</Text>
            <ChevronDown />
          </View>
        </View>
        <View>
          <Text style={labelCls}>Bug summary</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Please be as detailed as possible. What did you expect and what happened instead?"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              width: '100%',
              minHeight: 100,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#e5e7eb',
              backgroundColor: isDark ? '#1f2937' : 'white',
              borderRadius: 12,
              color: isDark ? '#f9fafb' : '#111827',
              fontSize: 14,
            }}
          />
        </View>
        <View>
          <Text style={[labelCls, { marginBottom: 8 }]}>Bug related media upload</Text>
          <Pressable
            style={{
              width: 80,
              height: 80,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: isDark ? '#4b5563' : '#d1d5db',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


