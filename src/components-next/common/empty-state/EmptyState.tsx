import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
};

export const EmptyState = ({ icon, title, subtitle }: EmptyStateProps) => {
  return (
    <Animated.View
      style={tailwind.style('flex-1 items-center justify-center px-8')}>
      <View style={tailwind.style('mb-4')}>{icon}</View>
      <Text
        style={tailwind.style(
          'text-lg font-inter-medium-24 text-gray-950 text-center mb-2',
        )}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={tailwind.style(
            'text-sm font-inter-normal-20 text-gray-600 text-center',
          )}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
};
