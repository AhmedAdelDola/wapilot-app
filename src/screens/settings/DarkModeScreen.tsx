import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectTheme } from '@/store/settings/settingsSelectors';
import { setTheme } from '@/store/settings/settingsSlice';

const DARK_MODE_OPTIONS = [
  { id: 'system', label: 'Use system settings' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const DarkModeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);

  const handleSelectTheme = (theme: 'system' | 'light' | 'dark') => {
    dispatch(setTheme(theme));
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
          <Text style={tailwind.style('text-xl')}>←</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Dark mode
        </Text>
        <Pressable hitSlop={16}>
          <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-400')}>
            Change
          </Text>
        </Pressable>
      </View>

      <View style={tailwind.style('pt-4')}>
        {DARK_MODE_OPTIONS.map(option => (
          <Pressable
            key={option.id}
            onPress={() => handleSelectTheme(option.id as 'system' | 'light' | 'dark')}
            style={tailwind.style('flex-row items-center px-6 py-4')}>
            <View style={tailwind.style('flex-1')}>
              <Text style={tailwind.style('text-[16px] font-inter-normal-20 text-gray-950')}>
                {option.label}
              </Text>
            </View>
            {currentTheme === option.id && (
              <Text style={tailwind.style('text-green-500 text-xl')}>✓</Text>
            )}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default DarkModeScreen;
