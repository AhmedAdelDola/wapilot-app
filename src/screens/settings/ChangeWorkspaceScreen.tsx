import React, { useState } from 'react';
import { Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { useSelector } from 'react-redux';
import { selectAccounts, selectCurrentUserAccountId } from '@/store/auth/authSelectors';

const ChangeWorkspaceScreen = () => {
  const navigation = useNavigation();
  const accounts = useSelector(selectAccounts) || [];
  const currentAccountId = useSelector(selectCurrentUserAccountId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = accounts.filter((account: { name: string }) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 1);
  };

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
          Change workspace
        </Text>
        <View style={tailwind.style('w-6')} />
      </View>

      <View style={tailwind.style('px-6 pt-4')}>
        <View style={tailwind.style('flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4')}>
          <Text style={tailwind.style('text-gray-400 mr-2')}>🔍</Text>
          <TextInput
            style={tailwind.style('flex-1 text-[16px] font-inter-normal-20 text-gray-950')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {filteredAccounts.map((account: { id: number; name: string }) => (
          <Pressable
            key={account.id}
            style={tailwind.style(
              'flex-row items-center py-3',
              account.id === currentAccountId && 'bg-gray-50 rounded-lg',
            )}>
            <View style={tailwind.style('w-12 h-12 rounded-full bg-blue-200 items-center justify-center mr-3')}>
              <Text style={tailwind.style('text-[18px] font-inter-580-24 text-blue-600')}>
                {getInitials(account.name)}
              </Text>
            </View>
            <View style={tailwind.style('flex-1')}>
              <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
                wapilot
              </Text>
              <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-500')}>
                {account.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default ChangeWorkspaceScreen;
