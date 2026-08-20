import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';

type FilterChipProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

export const FilterChip = ({ label, isActive, onPress }: FilterChipProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        {...handlers}
        style={tailwind.style(
          'px-4 py-2 rounded-full',
          isActive ? 'bg-gray-950' : 'bg-gray-100',
        )}>
        <Text
          style={tailwind.style(
            'text-sm font-inter-medium-24',
            isActive ? 'text-white' : 'text-gray-700',
          )}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
