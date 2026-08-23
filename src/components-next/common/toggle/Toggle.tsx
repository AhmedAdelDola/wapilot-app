import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useHaptic } from '@/utils';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const ACTIVE_COLOR = '#3b82f6';
const INACTIVE_COLOR = '#d1d5db';

export const Toggle = ({ value, onValueChange }: ToggleProps) => {
  const hapticSelection = useHaptic();
  const translateX = useSharedValue(value ? 20 : 2);

  const handlePress = () => {
    hapticSelection?.();
    const newValue = !value;
    translateX.value = withTiming(newValue ? 20 : 2, { duration: 200 });
    onValueChange(newValue);
  };

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: value ? ACTIVE_COLOR : INACTIVE_COLOR,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          tailwind.style('w-[44px] h-[26px] rounded-full p-[2px]'),
          trackStyle,
        ]}>
        <Animated.View
          style={[
            tailwind.style('w-[22px] h-[22px] rounded-full bg-white'),
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};
