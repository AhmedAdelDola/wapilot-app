import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { Toggle } from '@/views/components';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectNotificationSettings } from '@/viewmodels/store/settings/settingsSelectors';
import { settingsActions } from '@/viewmodels/store/settings/settingsActions';
import { showToast } from '@/utils/toastUtils';

const UpdateNotificationsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const notificationSettings = useAppSelector(selectNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  const [mobilePushEnabled, setMobilePushEnabled] = useState(true);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [callSoundsEnabled, setCallSoundsEnabled] = useState(true);
  const [chatSoundsEnabled, setChatSoundsEnabled] = useState(true);

  useEffect(() => {
    if (notificationSettings) {
      setMobilePushEnabled(notificationSettings.selected_push_flags.length > 0);
      setCallSoundsEnabled(true);
      setChatSoundsEnabled(true);
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
            selected_push_flags: mobilePushEnabled ? allPushFlags : [],
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
  }, [dispatch, mobilePushEnabled, notificationSettings, navigation]);

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('flex-row items-center justify-between px-4 py-3 border-b border-gray-100')}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={tailwind.style('text-xl')}>{'\u2190'}</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Update notifications
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={16}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#626F7F" />
          ) : (
            <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-950')}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <View style={tailwind.style('px-6 pt-6')}>
        <View style={tailwind.style('flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
            Mobile Push Notification
          </Text>
          <Toggle
            value={mobilePushEnabled}
            onValueChange={setMobilePushEnabled}
          />
        </View>

        <Pressable
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950')}>
            For all contacts and mentions
          </Text>
          <Text style={tailwind.style('text-gray-400')}>{'\u25BC'}</Text>
        </Pressable>

        <Pressable
          onPress={() => setOfflineOnly(!offlineOnly)}
          style={tailwind.style('flex-row items-center mb-6')}>
          <View style={tailwind.style('w-5 h-5 border-2 border-gray-300 rounded mr-3 items-center justify-center')}>
            {offlineOnly && <Text style={tailwind.style('text-xs text-gray-950')}>{'\u2713'}</Text>}
          </View>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950 flex-1')}>
            Only send mobile notifications when I am Offline
          </Text>
        </Pressable>

        <View style={tailwind.style('flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
            In-app Call Sounds
          </Text>
          <Toggle
            value={callSoundsEnabled}
            onValueChange={setCallSoundsEnabled}
          />
        </View>

        <Pressable
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-6')}>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950 flex-1')}>
            Play for Contacts assigned to me and unassigned contacts
          </Text>
          <Text style={tailwind.style('text-gray-400')}>{'\u25BC'}</Text>
        </Pressable>

        <View style={tailwind.style('flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
            In-app Chat Sounds
          </Text>
          <Toggle
            value={chatSoundsEnabled}
            onValueChange={setChatSoundsEnabled}
          />
        </View>

        <Pressable
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between')}>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950 flex-1')}>
            For contacts assigned to me or unassigned contacts
          </Text>
          <Text style={tailwind.style('text-gray-400')}>{'\u25BC'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default UpdateNotificationsScreen;
