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
        borderBottomColor: isDark ? '#334155' : '#e5e7eb',
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      }}>
      <Pressable onPress={onPress} style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: '#3b82f6', paddingLeft: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#60a5fa' : '#2563eb' }}>
          {isArabic ? 'رد على' : 'Replying to'} {quoteMessage.sender?.name || ''}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#64748b', marginTop: 2 }}>
          {preview}
        </Text>
      </Pressable>
      <Pressable onPress={onClose} hitSlop={12} style={{ padding: 8 }}>
        <Text style={{ fontSize: 18, color: isDark ? '#94a3b8' : '#6b7280' }}>×</Text>
      </Pressable>
    </View>
  );
};
