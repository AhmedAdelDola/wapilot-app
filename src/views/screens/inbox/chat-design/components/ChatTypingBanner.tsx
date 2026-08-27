import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

type ChatTypingBannerProps = {
  typingText: string;
  isDark: boolean;
};

export const ChatTypingBanner = ({ typingText, isDark }: ChatTypingBannerProps) => {
  if (!typingText) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}>
        <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
          {typingText}
        </Text>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../../../assets/local/typing.gif')}
          style={{ width: 28, height: 28, marginLeft: 4 }}
          contentFit="contain"
        />
      </View>
    </View>
  );
};
