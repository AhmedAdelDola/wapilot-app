import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useHaptic } from '@/utils';
import { CaretBottomSmall } from '@/svg-icons';

type SidebarSectionProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
};

export const SidebarSection = ({
  title,
  icon,
  children,
  defaultExpanded = true,
}: SidebarSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hapticSelection = useHaptic();
  const rotation = useSharedValue(defaultExpanded ? 0 : -90);

  const toggleExpanded = () => {
    hapticSelection?.();
    setIsExpanded(!isExpanded);
    rotation.value = withTiming(isExpanded ? -90 : 0, { duration: 200 });
  };

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={tailwind.style('mb-2')}>
      <Pressable
        onPress={toggleExpanded}
        style={tailwind.style('flex-row items-center px-4 py-3 mx-3')}>
        <View style={tailwind.style('w-6 h-6 items-center justify-center mr-3')}>
          {icon}
        </View>
        <Text
          style={tailwind.style(
            'flex-1 text-[16px] font-inter-medium-24 text-gray-950',
          )}>
          {title}
        </Text>
        <Animated.View style={animatedChevronStyle}>
          <CaretBottomSmall />
        </Animated.View>
      </Pressable>
      {isExpanded && (
        <View style={tailwind.style('ml-4')}>{children}</View>
      )}
    </View>
  );
};
