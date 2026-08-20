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
      style={[
        tailwind.style('absolute bottom-24 right-5'),
        animatedStyle,
      ]}>
      <Pressable
        onPress={handlePress}
        {...handlers}
        style={tailwind.style(
          'flex-row items-center bg-gray-950 px-5 py-3 rounded-full',
          'shadow-lg',
        )}>
        {icon && (
          <Animated.View style={tailwind.style('mr-2')}>{icon}</Animated.View>
        )}
        <Text
          style={tailwind.style(
            'text-[15px] font-inter-medium-24 text-white',
          )}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
