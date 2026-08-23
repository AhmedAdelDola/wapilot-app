import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { useSelector } from 'react-redux';
import { selectAccounts, selectCurrentUserAccountId } from '@/store/auth/authSelectors';
import { authActions } from '@/store/auth/authActions';
import { useAppDispatch } from '@/hooks';
import { showToast } from '@/utils/toastUtils';

const ChangeWorkspaceScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const accounts = useSelector(selectAccounts) || [];
  const currentAccountId = useSelector(selectCurrentUserAccountId);
  const [searchQuery, setSearchQuery] = useState('');
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const filteredAccounts = accounts.filter((account: { name: string }) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSwitchWorkspace = async (accountId: number) => {
    if (accountId === currentAccountId || switchingId !== null) return;
    setSwitchingId(accountId);
    try {
      await dispatch(
        authActions.setActiveAccount({ profile: { account_id: accountId } }),
      ).unwrap();
      await dispatch(authActions.getProfile()).unwrap();
      navigation.goBack();
    } catch {
      showToast({ message: 'Failed to switch workspace' });
    } finally {
      setSwitchingId(null);
    }
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
          <Text style={tailwind.style('text-xl')}>{'\u2715'}</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Change workspace
        </Text>
        <View style={tailwind.style('w-6')} />
      </View>

      <View style={tailwind.style('px-6 pt-4')}>
        <View style={tailwind.style('flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4')}>
          <Text style={tailwind.style('text-gray-400 mr-2')}>{'\uD83D\uDD0D'}</Text>
          <TextInput
            style={tailwind.style('flex-1 text-[16px] font-inter-normal-20 text-gray-950')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {filteredAccounts.map((account: { id: number; name: string }) => {
          const isActive = account.id === currentAccountId;
          const isSwitching = switchingId === account.id;
          return (
            <Pressable
              key={account.id}
              onPress={() => handleSwitchWorkspace(account.id)}
              disabled={isSwitching}
              style={tailwind.style(
                'flex-row items-center py-3 px-2 rounded-lg mb-1',
                isActive && 'bg-gray-50',
              )}>
              <View
                style={tailwind.style(
                  'w-12 h-12 rounded-full items-center justify-center mr-3',
                  isActive ? 'bg-teal-500' : 'bg-blue-200',
                )}>
                {isSwitching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={tailwind.style(
                      'text-[18px] font-inter-580-24',
                      isActive ? 'text-white' : 'text-blue-600',
                    )}>
                    {getInitials(account.name)}
                  </Text>
                )}
              </View>
              <View style={tailwind.style('flex-1')}>
                <Text style={tailwind.style('text-[16px] font-inter-medium-24 text-gray-950')}>
                  {account.name}
                </Text>
                {isActive && (
                  <Text style={tailwind.style('text-[12px] font-inter-normal-20 text-teal-500')}>
                    Active
                  </Text>
                )}
              </View>
              {isActive && (
                <Text style={tailwind.style('text-teal-500 text-lg')}>{'\u2713'}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default ChangeWorkspaceScreen;
