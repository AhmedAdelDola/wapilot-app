import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/theme';

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
};

export const EmptyState = ({ icon, title, subtitle }: EmptyStateProps) => {
  const { isDark } = useTheme();

  return (
    <Animated.View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}>
      <View style={{ marginBottom: 16 }}>{icon}</View>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'Gontserrat-Bold',
          color: isDark ? '#EDEEF0' : '#282E34',
          textAlign: 'center',
          marginBottom: 8,
          fontWeight: '600',
        }}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Gontserrat-Regular',
            color: isDark ? '#94a3b8' : '#626F7F',
            textAlign: 'center',
            lineHeight: 20,
          }}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
};
