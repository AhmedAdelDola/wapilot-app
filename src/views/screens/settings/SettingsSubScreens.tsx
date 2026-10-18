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
} from '@/viewmodels/store/auth/authSelectors';
import { authActions } from '@/viewmodels/store/auth/authActions';
import {
  selectNotificationSettings,
  selectTheme,
  selectLocale,
} from '@/viewmodels/store/settings/settingsSelectors';
import { settingsActions } from '@/viewmodels/store/settings/settingsActions';
import { setTheme, setLocale } from '@/viewmodels/store/settings/settingsSlice';
import i18n from '@/i18n';
import { inboxActions } from '@/viewmodels/store/inbox/inboxActions';
import { showToast } from '@/utils/toastUtils';
import { Account } from '@/models/types/Account';
import { User } from '@/models/types/User';
import { useTheme } from '@/theme';

// ---------- Theme Helper ----------
const useIsDark = () => useTheme().isDark;

// ---------- Shared icons ----------
const ArrowLeft = ({ color = '#282E34' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ transform: [{ scaleX: i18n.isRTL ? -1 : 1 }] }}>
    <Path d="M19 12H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = ({ color = '#80838D' }: { color?: string }) => (
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
    <Circle cx="11" cy="11" r="8" stroke="#80838D" strokeWidth="2" />
    <Path d="m21 21-4.35-4.35" stroke="#80838D" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const OrganizationIcon = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
      backgroundColor: on ? '#4162E3' : '#EAEAEA',
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
        borderBottomColor: isDark ? '#212121' : '#EAEAEA',
        backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA',
      }}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <ArrowLeft color={isDark ? '#FAFAFA' : '#0D0D0D'} />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FAFAFA' : '#0D0D0D' }}>{title}</Text>
      <View style={{ minWidth: 48, alignItems: 'flex-end' }}>
        {right && (
          <Pressable onPress={onRightPress} disabled={rightLoading} hitSlop={12}>
            {rightLoading ? (
              <ActivityIndicator size="small" color="#4162E3" />
            ) : (
              <Text style={{ color: '#4162E3', fontWeight: '600', fontSize: 15 }}>{right}</Text>
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
    borderColor: isDark ? '#626F7F' : '#EAEAEA',
    backgroundColor: isDark ? '#1B1C20' : '#ffffff',
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Update notifications" right="Save" onRightPress={handleSave} rightLoading={isSaving} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 24 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', fontSize: 16 }}>Mobile Push Notification</Text>
            <Toggle on={mobilePush} onToggle={() => setMobilePush(!mobilePush)} />
          </View>
          <Pressable style={dropdownStyle} onPress={() => setActiveModal('push')}>
            <Text style={{ color: isDark ? '#EAEAEA' : '#626F7F', fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 }}>
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
                borderColor: offlineOnly ? '#4162E3' : (isDark ? '#626F7F' : '#EAEAEA'),
                backgroundColor: offlineOnly ? '#4162E3' : (isDark ? '#161616' : '#FAFAFA'),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {offlineOnly && <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 14, color: isDark ? '#80838D' : '#626F7F' }}>Only send mobile notifications when I am Offline</Text>
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? '#24262B' : '#EAEAEA' }} />

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', fontSize: 16 }}>In-app Call Sounds</Text>
            <Toggle on={callSounds} onToggle={() => setCallSounds(!callSounds)} />
          </View>
          <Pressable style={dropdownStyle} onPress={() => setActiveModal('call')}>
            <Text style={{ color: isDark ? '#EAEAEA' : '#626F7F', fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 }}>
              {getCallScopeLabel()}
            </Text>
            <ChevronDown />
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? '#24262B' : '#EAEAEA' }} />

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', fontSize: 16 }}>In-app Chat Sounds</Text>
            <Toggle on={chatSounds} onToggle={() => setChatSounds(!chatSounds)} />
          </View>
          <Pressable style={dropdownStyle} onPress={() => setActiveModal('chat')}>
            <Text style={{ color: isDark ? '#EAEAEA' : '#626F7F', fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 }}>
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
                backgroundColor: isDark ? '#1B1C20' : '#ffffff',
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
                  backgroundColor: isDark ? '#626F7F' : '#EAEAEA',
                  borderRadius: 999,
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />
              <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#EDEEF0' : '#282E34', marginBottom: 12 }}>
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
                      borderBottomColor: isDark ? '#626F7F' : '#F0F0F3',
                    }}>
                    <Text
                      style={{
                        fontSize: 15,
                        color: isSelected ? '#4162E3' : (isDark ? '#FAFAFA' : '#626F7F'),
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
  const dispatch = useAppDispatch();
  const isChangingPassword = useAppSelector(state => state.auth.uiFlags.isChangingPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inputCls = {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: isDark ? '#626F7F' : '#EAEAEA',
    backgroundColor: isDark ? '#1B1C20' : '#ffffff',
    borderRadius: 12,
    color: isDark ? '#EDEEF0' : '#282E34',
    fontSize: 14,
  } as const;

  const labelCls = { fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', marginBottom: 6, fontSize: 14 } as const;

  const handleChangePassword = useCallback(async () => {
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

    try {
      await dispatch(authActions.changePassword({
        profile: {
          current_password: currentPassword,
          password: nextPassword,
          password_confirmation: confirmPassword,
        },
      })).unwrap();
      showToast({ message: 'Password updated successfully' });
      navigation.goBack();
    } catch (error: any) {
      const message = error?.errors?.[0] || 'Failed to change password';
      Alert.alert('Error', message);
    }
  }, [currentPassword, nextPassword, confirmPassword, dispatch, navigation]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Change password" right="Save" onRightPress={handleChangePassword} rightLoading={isChangingPassword} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 20 }}>
        <View>
          <Text style={labelCls}>Existing Password</Text>
          <TextInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#80838D"
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
            placeholderTextColor="#80838D"
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
            placeholderTextColor="#80838D"
            style={inputCls}
          />
        </View>
        <Text style={{ fontSize: 13, color: isDark ? '#80838D' : '#626F7F', lineHeight: 20 }}>
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

  const currentLocale = useAppSelector(selectLocale) || 'en';
  const isArabic = currentLocale === 'ar';
  const currentLanguageLabel = isArabic ? 'العربية' : 'English';
  const currentLanguageFlag = isArabic ? '🇸🇦' : '🇬🇧';

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
    borderColor: isDark ? '#626F7F' : '#EAEAEA',
    backgroundColor: isDark ? '#1B1C20' : '#ffffff',
    borderRadius: 12,
    color: isDark ? '#EDEEF0' : '#282E34',
    fontSize: 14,
    fontWeight: '500' as const,
  } as const;

  const labelCls = { fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', marginBottom: 6, fontSize: 14 } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
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
                backgroundColor: '#4162E3',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: '700' }}>{initialLetter}</Text>
            </View>
          )}
          <Text style={{ fontWeight: '700', color: isDark ? '#EDEEF0' : '#282E34', fontSize: 18 }}>{user?.name || 'User'}</Text>
          <Text style={{ color: isDark ? '#80838D' : '#626F7F', fontSize: 14, marginTop: 2 }}>{email}</Text>
        </View>

        <View style={{ gap: 20 }}>
          <View>
            <Text style={labelCls}>First Name</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={inputCls} placeholder="Enter first name" placeholderTextColor="#80838D" />
          </View>
          <View>
            <Text style={labelCls}>Last Name</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={inputCls} placeholder="Enter last name" placeholderTextColor="#80838D" />
          </View>
          <View>
            <Text style={labelCls}>Email</Text>
            <TextInput value={email} editable={false} style={[inputCls, { backgroundColor: isDark ? '#282E34' : '#EDEEF0', color: '#80838D' }]} />
          </View>
          <View>
            <Text style={labelCls}>{i18n.t('SETTINGS.LANGUAGE')}</Text>
            <Pressable
              onPress={() => navigation.navigate('ChangeLanguageScreen')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: isDark ? '#626F7F' : '#EAEAEA',
                backgroundColor: isDark ? '#1B1C20' : '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>{currentLanguageFlag}</Text>
                <Text style={{ color: isDark ? '#EDEEF0' : '#626F7F', fontSize: 14, fontWeight: '500' }}>
                  {currentLanguageLabel}
                </Text>
              </View>
              <ChevronDown />
            </Pressable>
            <Text style={{ color: '#80838D', fontSize: 12, marginTop: 8 }}>
              {isArabic ? 'يمكنك التبديل بين اللغات في أي وقت.' : 'All languages are currently supported.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 4. Change Workspace Screen
// ==========================================
interface OrgGroup {
  orgName: string;
  accounts: Account[];
}

const getAccountOrgName = (account: Account, user?: User | null): string => {
  const acc = account as any;
  const orgFromAccount =
    acc?.organization?.name ||
    (typeof acc?.organization === 'string' ? acc.organization : null) ||
    acc?.organization_name ||
    acc?.org_name ||
    acc?.company_name ||
    acc?.custom_attributes?.organization;

  if (orgFromAccount && typeof orgFromAccount === 'string' && orgFromAccount.trim()) {
    return orgFromAccount.trim();
  }

  const u = user as any;
  if (Array.isArray(u?.organizations) && u.organizations.length > 0) {
    const matched = u.organizations.find(
      (org: any) =>
        org?.id === acc?.organization_id ||
        (Array.isArray(org?.accounts) && org.accounts.some((a: any) => (a?.id || a) === acc?.id)) ||
        (Array.isArray(org?.account_ids) && org.account_ids.includes(acc?.id)),
    );
    if (matched?.name && typeof matched.name === 'string' && matched.name.trim()) {
      return matched.name.trim();
    }
  }

  const orgFromUser =
    u?.organization?.name ||
    (typeof u?.organization === 'string' ? u.organization : null) ||
    u?.organization_name ||
    u?.org_name ||
    u?.company_name;

  if (orgFromUser && typeof orgFromUser === 'string' && orgFromUser.trim()) {
    return orgFromUser.trim();
  }

  return 'Organization';
};

export const ChangeWorkspaceScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const user = useAppSelector(selectUser);
  const accounts = useAppSelector(selectAccounts) || [];
  const currentAccountId = useAppSelector(selectCurrentUserAccountId);

  const [query, setQuery] = useState('');
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const trimmedQuery = query.toLowerCase().trim();

  const groupedAccounts = React.useMemo(() => {
    const map = new Map<string, Account[]>();

    accounts.forEach((account: Account) => {
      const orgName = getAccountOrgName(account, user);
      const matchesQuery =
        !trimmedQuery ||
        account.name?.toLowerCase().includes(trimmedQuery) ||
        orgName.toLowerCase().includes(trimmedQuery);

      if (matchesQuery) {
        if (!map.has(orgName)) {
          map.set(orgName, []);
        }
        map.get(orgName)!.push(account);
      }
    });

    const groups: OrgGroup[] = [];
    map.forEach((accs, orgName) => {
      groups.push({ orgName, accounts: accs });
    });
    return groups;
  }, [accounts, user, trimmedQuery]);

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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title="Change workspace" />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: isDark ? '#212121' : '#EAEAEA',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}>
          <SearchSmall />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search workspace"
            placeholderTextColor="#80838D"
            style={{ flex: 1, color: isDark ? '#EDEEF0' : '#282E34', fontSize: 14 }}
          />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {groupedAccounts.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <Text style={{ color: isDark ? '#80838D' : '#64748b', fontSize: 14 }}>
              {query ? 'No matching workspaces found' : 'No workspaces available'}
            </Text>
          </View>
        ) : (
          groupedAccounts.map(group => (
            <View key={group.orgName} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}>
                <OrganizationIcon color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    color: isDark ? '#9CA3AF' : '#6B7280',
                  }}>
                  {group.orgName}
                </Text>
              </View>
              {group.accounts.map((account: Account) => {
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
                      backgroundColor: isActive ? (isDark ? '#161616' : '#f0fdfa') : 'transparent',
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#212121' : '#EAEAEA',
                      marginBottom: 4,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          backgroundColor: isActive ? '#4162E3' : (isDark ? '#626F7F' : '#4162E3'),
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
                        <Text style={{ fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', fontSize: 15 }}>
                          {account.name}
                        </Text>
                      </View>
                    </View>
                    {isActive && <CheckIcon />}
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
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
              borderBottomColor: isDark ? '#24262B' : '#EAEAEA',
            }}>
            <Text style={{ color: isDark ? '#EDEEF0' : '#282E34', fontSize: 15, fontWeight: currentTheme === opt.id ? '600' : '400' }}>
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

  const labelCls = { fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34', marginBottom: 6, fontSize: 14 } as const;

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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
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
              borderColor: isDark ? '#626F7F' : '#EAEAEA',
              backgroundColor: isDark ? '#1B1C20' : '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
            <Text style={{ color: isDark ? '#EAEAEA' : '#626F7F', fontSize: 14 }}>Inbox & Messages</Text>
            <ChevronDown />
          </View>
        </View>
        <View>
          <Text style={labelCls}>Bug summary</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Please be as detailed as possible. What did you expect and what happened instead?"
            placeholderTextColor="#80838D"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              width: '100%',
              minHeight: 100,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: isDark ? '#626F7F' : '#EAEAEA',
              backgroundColor: isDark ? '#1B1C20' : '#ffffff',
              borderRadius: 12,
              color: isDark ? '#EDEEF0' : '#282E34',
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
              borderColor: isDark ? '#626F7F' : '#EAEAEA',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#80838D" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==========================================
// 7. Change Language Screen
// ==========================================
export const ChangeLanguageScreen = () => {
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const currentLocale = useAppSelector(selectLocale) || 'en';
  const [search, setSearch] = useState('');

  const featured = [
    { code: 'ar', name: 'العربية', englishName: 'Arabic', flag: '🇸🇦' },
    { code: 'en', name: 'English', englishName: 'English', flag: '🇬🇧' },
  ];

  const allLanguages = [
    ...featured,
    { code: 'fr', name: 'Français', englishName: 'French', flag: '🇫🇷' },
    { code: 'es', name: 'Español', englishName: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', englishName: 'German', flag: '🇩🇪' },
    { code: 'tr', name: 'Türkçe', englishName: 'Turkish', flag: '🇹🇷' },
    { code: 'it', name: 'Italiano', englishName: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', englishName: 'Portuguese', flag: '🇵🇹' },
    { code: 'pt_BR', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', flag: '🇧🇷' },
    { code: 'ru', name: 'Русский', englishName: 'Russian', flag: '🇷🇺' },
    { code: 'fa', name: 'فارسی', englishName: 'Farsi', flag: '🇮🇷' },
    { code: 'zh_CN', name: '简体中文', englishName: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh_TW', name: '繁體中文', englishName: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'ja', name: '日本語', englishName: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', englishName: 'Korean', flag: '🇰🇷' },
    { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian', flag: '🇮🇩' },
    { code: 'nl', name: 'Nederlands', englishName: 'Dutch', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', englishName: 'Polish', flag: '🇵🇱' },
    { code: 'sv', name: 'Svenska', englishName: 'Swedish', flag: '🇸🇪' },
    { code: 'uk', name: 'Українська', englishName: 'Ukrainian', flag: '🇺🇦' },
    { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese', flag: '🇻🇳' },
  ];

  const filtered = allLanguages.filter(
    l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.englishName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (code: string) => {
    i18n.locale = code;
    dispatch(setLocale(code));
    showToast({ message: i18n.t('SETTINGS.SET_LANGUAGE_SUCCESS') });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }}>
      <StatusBar translucent backgroundColor={isDark ? '#0D0D0D' : '#FAFAFA'} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SubHeader title={i18n.t('SETTINGS.CHANGE_LANGUAGE')} />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#1B1C20' : '#F4F5F7',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 16,
            gap: 8,
          }}>
          <SearchSmall />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={i18n.t('SETTINGS.SET_LANGUAGE')}
            placeholderTextColor="#80838D"
            style={{
              flex: 1,
              color: isDark ? '#EDEEF0' : '#282E34',
              fontSize: 14,
              padding: 0,
            }}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {filtered.map(opt => {
            const isSelected = currentLocale === opt.code || (opt.code === 'en' && currentLocale.startsWith('en'));
            return (
              <Pressable
                key={opt.code}
                onPress={() => handleSelect(opt.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? '#24262B' : '#EAEAEA',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>{opt.flag}</Text>
                  <View>
                    <Text
                      style={{
                        color: isDark ? '#EDEEF0' : '#282E34',
                        fontSize: 15,
                        fontWeight: isSelected ? '700' : '500',
                      }}>
                      {opt.name}
                    </Text>
                    {opt.name !== opt.englishName && (
                      <Text style={{ color: '#80838D', fontSize: 12, marginTop: 2 }}>{opt.englishName}</Text>
                    )}
                  </View>
                </View>
                {isSelected && <CheckIcon />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};


