import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';

type FilterChipProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
};

export const FilterChip = ({ label, isActive, onPress }: FilterChipProps) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic();
  const { isDark } = useTheme();

  const handlePress = () => {
    hapticSelection?.();
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        {...handlers}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: isActive
            ? (isDark ? '#3b82f6' : '#111827')
            : (isDark ? '#1e293b' : '#f3f4f6'),
          borderWidth: 1,
          borderColor: isActive
            ? (isDark ? '#3b82f6' : '#111827')
            : (isDark ? '#334155' : '#e5e7eb'),
        }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Inter-500-24',
            color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#374151'),
          }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
