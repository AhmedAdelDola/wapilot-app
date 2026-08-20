import React, { useState } from 'react';
import { Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [existingPassword, setExistingPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('flex-row items-center justify-between px-4 py-3 border-b border-gray-100')}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={tailwind.style('text-xl')}>✕</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Change password
        </Text>
        <Pressable hitSlop={16}>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-400')}>
            Change
          </Text>
        </Pressable>
      </View>

      <View style={tailwind.style('px-6 pt-6')}>
        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Existing Password
        </Text>
        <TextInput
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-6')}
          value={existingPassword}
          onChangeText={setExistingPassword}
          placeholder="Enter current password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          New Password
        </Text>
        <TextInput
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-6')}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Confirm New Password
        </Text>
        <TextInput
          style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-4')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-700 leading-5')}>
          Your password must be at least 8 characters long, include a number, an uppercase letter, a special character and a lowercase letter.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;
