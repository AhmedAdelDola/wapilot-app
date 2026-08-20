import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  count: number;
  isActive?: boolean;
  onPress: () => void;
};

export const SidebarItem = ({ icon, label, count, isActive, onPress }: SidebarItemProps) => {
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
          'flex-row items-center px-4 py-3 mx-3 rounded-lg',
          isActive && 'bg-blue-50',
        )}>
        <View style={tailwind.style('w-6 h-6 items-center justify-center mr-3')}>
          {icon}
        </View>
        <Text
          style={tailwind.style(
            'flex-1 text-[16px] font-inter-normal-20',
            isActive ? 'text-blue-600' : 'text-gray-950',
          )}>
          {label}
        </Text>
        <Text
          style={tailwind.style(
            'text-[14px] font-inter-normal-20',
            isActive ? 'text-blue-600' : 'text-gray-500',
          )}>
          {count}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
