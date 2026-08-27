import React from 'react';
import { Text, View } from 'react-native';
import { tailwind } from '@/theme';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

export const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  return (
    <View style={tailwind.style('pt-6')}>
      <Text
        style={tailwind.style(
          'text-[13px] font-inter-medium-24 text-gray-500 uppercase tracking-wider px-5 mb-2',
        )}>
        {title}
      </Text>
      <View style={tailwind.style('bg-white')}>{children}</View>
    </View>
  );
};
