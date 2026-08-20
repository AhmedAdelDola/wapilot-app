import React, { useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { Toggle } from '@/components-next';

const UpdateNotificationsScreen = () => {
  const navigation = useNavigation();
  const [mobilePushEnabled, setMobilePushEnabled] = useState(true);
  const [pushFilter, setPushFilter] = useState('For all contacts and mentions');
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [callSoundsEnabled, setCallSoundsEnabled] = useState(true);
  const [callSoundsFilter, setCallSoundsFilter] = useState('Play for Contacts assigned to me and unassigned contacts');
  const [chatSoundsEnabled, setChatSoundsEnabled] = useState(true);
  const [chatSoundsFilter, setChatSoundsFilter] = useState('For contacts assigned to me or unassigned contacts');

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('flex-row items-center justify-between px-4 py-3 border-b border-gray-100')}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={tailwind.style('text-xl')}>←</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Update notifications
        </Text>
        <Pressable hitSlop={16}>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-400')}>
            Change
          </Text>
        </Pressable>
      </View>

      <View style={tailwind.style('px-6 pt-6')}>
        <View style={tailwind.style('flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
            Mobile Push Notification
          </Text>
          <Toggle value={mobilePushEnabled} onValueChange={setMobilePushEnabled} />
        </View>

        <Pressable
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950')}>
            {pushFilter}
          </Text>
          <Text style={tailwind.style('text-gray-400')}>▼</Text>
        </Pressable>

        <Pressable
          onPress={() => setOfflineOnly(!offlineOnly)}
          style={tailwind.style('flex-row items-center mb-6')}>
          <View style={tailwind.style('w-5 h-5 border-2 border-gray-300 rounded mr-3 items-center justify-center')}>
            {offlineOnly && <Text style={tailwind.style('text-xs text-gray-950')}>✓</Text>}
          </View>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950 flex-1')}>
            Only send mobile notifications when I am Offline
          </Text>
        </Pressable>

        <View style={tailwind.style('flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
            In-app Call Sounds
          </Text>
          <Toggle value={callSoundsEnabled} onValueChange={setCallSoundsEnabled} />
        </View>

        <Pressable
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-6')}>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950 flex-1')}>
            {callSoundsFilter}
          </Text>
          <Text style={tailwind.style('text-gray-400')}>▼</Text>
        </Pressable>

        <View style={tailwind.style('flex-row items-center justify-between mb-4')}>
          <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
            In-app Chat Sounds
          </Text>
          <Toggle value={chatSoundsEnabled} onValueChange={setChatSoundsEnabled} />
        </View>

        <Pressable
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between')}>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950 flex-1')}>
            {chatSoundsFilter}
          </Text>
          <Text style={tailwind.style('text-gray-400')}>▼</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default UpdateNotificationsScreen;
