import React, { useState } from 'react';
import { Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';

const ReportBugScreen = () => {
  const navigation = useNavigation();
  const [bugLocation, setBugLocation] = useState('');
  const [bugSummary, setBugSummary] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const bugLocations = [
    'Inbox',
    'Conversations',
    'Calls',
    'Settings',
    'Notifications',
    'Other',
  ];

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
          Report a bug
        </Text>
        <Pressable hitSlop={16}>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-400')}>
            Send
          </Text>
        </Pressable>
      </View>

      <View style={tailwind.style('px-6 pt-6')}>
        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Select bug location
        </Text>
        <Pressable
          onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-6')}>
          <Text style={tailwind.style(
            'text-[16px] font-inter-normal-20',
            bugLocation ? 'text-gray-950' : 'text-gray-400',
          )}>
            {bugLocation || 'Select bug location'}
          </Text>
          <Text style={tailwind.style('text-gray-400')}>▼</Text>
        </Pressable>

        {showLocationDropdown && (
          <View style={tailwind.style('border border-gray-200 rounded-lg mb-6 -mt-4 bg-white')}>
            {bugLocations.map(location => (
              <Pressable
                key={location}
                onPress={() => {
                  setBugLocation(location);
                  setShowLocationDropdown(false);
                }}
                style={tailwind.style('px-4 py-3 border-b border-gray-100 last:border-b-0')}>
                <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-950')}>
                  {location}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Bug summary
        </Text>
        <TextInput
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-6 h-32')}
          value={bugSummary}
          onChangeText={setBugSummary}
          placeholder="Please be as detailed as possible. What did you expect and what happened instead?"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
        />

        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Bug related media upload
        </Text>
        <Pressable
          style={tailwind.style('w-16 h-16 border border-gray-200 rounded-lg items-center justify-center')}>
          <Text style={tailwind.style('text-2xl text-gray-400')}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ReportBugScreen;
