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
            ? (isDark ? '#725AFF' : '#282E34')
            : (isDark ? '#1B1C20' : '#F0F0F3'),
          borderWidth: 1,
          borderColor: isActive
            ? (isDark ? '#725AFF' : '#282E34')
            : (isDark ? '#24262B' : '#EAEAEA'),
        }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Gontserrat-Bold',
            color: isActive ? '#ffffff' : (isDark ? '#B0B4BA' : '#626F7F'),
          }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
