import React from 'react';
import { Text, View } from 'react-native';
import { tailwind } from '@/theme';

type SectionHeaderProps = {
  title: string;
  count?: number;
};

export const SectionHeader = ({ title, count }: SectionHeaderProps) => {
  return (
    <View
      style={tailwind.style(
        'flex-row items-center justify-between px-5 py-3',
      )}>
      <Text
        style={tailwind.style(
          'text-[13px] font-inter-medium-24 text-gray-500 uppercase tracking-wider',
        )}>
        {title}
      </Text>
      {count !== undefined && (
        <Text
          style={tailwind.style(
            'text-[13px] font-inter-medium-24 text-gray-500',
          )}>
          {count}
        </Text>
      )}
    </View>
  );
};
