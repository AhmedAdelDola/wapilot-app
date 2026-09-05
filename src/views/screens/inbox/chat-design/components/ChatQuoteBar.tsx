import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Message } from '@/models/types';
import { getMessageText } from '../utils/chatMessageUtils';

type ChatQuoteBarProps = {
  quoteMessage: Message;
  isDark: boolean;
  isArabic: boolean;
  onClose: () => void;
  onPress?: () => void;
};

export const ChatQuoteBar = ({
  quoteMessage,
  isDark,
  isArabic,
  onClose,
  onPress,
}: ChatQuoteBarProps) => {
  const preview = getMessageText(quoteMessage) || quoteMessage.attachments?.[0]?.fileType || '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#24262B' : '#EAEAEA',
        backgroundColor: isDark ? '#1B1C20' : '#EDEEF0',
      }}>
      <Pressable onPress={onPress} style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: '#725AFF', paddingLeft: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#725AFF' : '#725AFF' }}>
          {isArabic ? 'رد على' : 'Replying to'} {quoteMessage.sender?.name || ''}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 13, color: isDark ? '#B0B4BA' : '#80838D', marginTop: 2 }}>
          {preview}
        </Text>
      </Pressable>
      <Pressable onPress={onClose} hitSlop={12} style={{ padding: 8 }}>
        <Text style={{ fontSize: 18, color: isDark ? '#94a3b8' : '#626F7F' }}>×</Text>
      </Pressable>
    </View>
  );
};
