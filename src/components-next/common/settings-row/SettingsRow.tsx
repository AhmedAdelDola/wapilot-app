import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';
import { CaretRightSmall } from '@/svg-icons';

type SettingsRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  hasChevron?: boolean;
  rightElement?: React.ReactNode;
};

export const SettingsRow = ({
  icon,
  title,
  subtitle,
  onPress,
  hasChevron = true,
  rightElement,
}: SettingsRowProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        disabled={!onPress}
        {...handlers}
        style={tailwind.style(
          'flex-row items-center px-5 py-4',
          onPress && 'active:bg-gray-50',
        )}>
        <View style={tailwind.style('w-6 h-6 items-center justify-center mr-4')}>
          {icon}
        </View>
        <View style={tailwind.style('flex-1')}>
          <Text
            style={tailwind.style(
              'text-[16px] font-inter-normal-20 text-gray-950',
            )}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={tailwind.style(
                'text-[14px] font-inter-normal-20 text-gray-600 mt-0.5',
              )}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement && <View style={tailwind.style('mr-2')}>{rightElement}</View>}
        {hasChevron && onPress && (
          <View style={tailwind.style('ml-2')}>
            <CaretRightSmall />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};
