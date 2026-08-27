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
  isDark?: boolean;
  onPress: () => void;
};

export const SidebarItem = ({ icon, label, count, isActive, isDark = false, onPress }: SidebarItemProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    onPress();
  };

  const activeBg = isDark ? 'bg-blue-900/30' : 'bg-blue-50';
  const activeText = isDark ? 'text-blue-400' : 'text-blue-600';
  const inactiveText = isDark ? 'text-gray-300' : 'text-gray-950';
  const inactiveCount = isDark ? 'text-gray-500' : 'text-gray-500';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        {...handlers}
        style={tailwind.style(
          'flex-row items-center px-4 py-3 mx-3 rounded-lg',
          isActive && activeBg,
        )}>
        <View style={tailwind.style('w-6 h-6 items-center justify-center mr-3')}>
          {icon}
        </View>
        <Text
          style={tailwind.style(
            'flex-1 text-[16px] font-inter-normal-20',
            isActive ? activeText : inactiveText,
          )}>
          {label}
        </Text>
        <Text
          style={tailwind.style(
            'text-[14px] font-inter-normal-20',
            isActive ? activeText : inactiveCount,
          )}>
          {count}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
