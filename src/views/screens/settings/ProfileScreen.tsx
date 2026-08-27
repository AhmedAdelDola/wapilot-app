import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { useSelector } from 'react-redux';
import { selectUser } from '@/viewmodels/store/auth/authSelectors';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const user = useSelector(selectUser);
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ')[1] || '');
  const [isSaving, setIsSaving] = useState(false);
  const email = user?.email || '';

  const hasChanges =
    firstName !== (user?.name?.split(' ')[0] || '') ||
    lastName !== (user?.name?.split(' ')[1] || '');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = useCallback(() => {
    if (!firstName.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigation.goBack();
    }, 500);
  }, [firstName, navigation]);

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
          Profile
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          hitSlop={16}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text
              style={tailwind.style(
                'text-[16px] font-inter-normal-20',
                hasChanges ? 'text-blue-500' : 'text-gray-400',
              )}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <View style={tailwind.style('flex-1')}>
        <View style={tailwind.style('items-center pt-8 pb-4')}>
          <View style={tailwind.style('w-24 h-24 rounded-full bg-teal-500 items-center justify-center mb-4')}>
            <Text style={tailwind.style('text-[32px] font-inter-580-24 text-white')}>
              {getInitials(user?.name || 'A')}
            </Text>
          </View>
          <Text style={tailwind.style('text-[20px] font-inter-580-24 text-gray-950 mb-1')}>
            {user?.name || 'User'}
          </Text>
          <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-500 mb-4')}>
            {email}
          </Text>
        </View>

        <View style={tailwind.style('px-6 pt-4')}>
          <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
            First Name
          </Text>
          <TextInput
            style={tailwind.style(
              'border rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-6',
              firstName.trim() ? 'border-gray-200' : 'border-red-300',
            )}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
            Last Name
          </Text>
          <TextInput
            style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-6')}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
            Email
          </Text>
          <TextInput
            style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-400 mb-6')}
            value={email}
            editable={false}
            placeholder=""
          />

          <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
            Language
          </Text>
          <Pressable
            style={tailwind.style('border border-gray-200 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-2')}>
            <View style={tailwind.style('flex-row items-center')}>
              <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-950')}>
                English
              </Text>
            </View>
            <Text style={tailwind.style('text-gray-400')}>{'\u25BC'}</Text>
          </Pressable>
          <Text style={tailwind.style('text-[12px] font-inter-normal-20 text-gray-400')}>
            All languages are currently in beta, with the exception of English.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
