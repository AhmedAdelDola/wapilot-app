import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';

type FABProps = {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
};

export const FAB = ({ label, onPress, icon }: FABProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    onPress();
  };

  return (
    <Animated.View
      style={tailwind.style(
        'absolute bottom-20 right-4',
        animatedStyle,
      )}>
      <Pressable
        onPress={handlePress}
        {...handlers}
        style={tailwind.style(
          'flex-row items-center bg-white px-4 py-2.5 rounded-2xl',
          'shadow-lg border border-gray-100',
        )}>
        {icon && (
          <Animated.View style={tailwind.style('mr-2')}>{icon}</Animated.View>
        )}
        <Text
          style={tailwind.style(
            'text-sm font-inter-medium-24 text-gray-800',
          )}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
