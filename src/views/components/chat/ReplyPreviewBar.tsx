import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Message } from '@/models/types';

const XIcon = ({ color = '#626F7F' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type ReplyPreviewBarProps = {
  quoteMessage: Message;
  isDark: boolean;
  isArabic?: boolean;
  onClose: () => void;
  onPress?: () => void;
};

const extractPreview = (message?: Message): string => {
  if (!message) return '';
  if (typeof message.content === 'string' && message.content.trim()) {
    return message.content.trim();
  }
  const contentObj = message.content as any;
  if (contentObj && typeof contentObj === 'object') {
    if (typeof contentObj.text === 'string') return contentObj.text.trim();
    if (typeof contentObj.message === 'string') return contentObj.message.trim();
  }
  if (message.attachments && message.attachments.length > 0) {
    const att = message.attachments[0];
    return att.fallbackTitle || att.fileType || 'Attachment';
  }
  return '';
};

export const ReplyPreviewBar = ({
  quoteMessage,
  isDark,
  isArabic = false,
  onClose,
  onPress,
}: ReplyPreviewBarProps) => {
  const preview = extractPreview(quoteMessage);
  const sender = quoteMessage.sender as any;
  const senderName = sender?.name || sender?.available_name || (isArabic ? 'مستخدم' : 'User');
  const isRTL = /[\u0600-\u06FF]/.test(preview);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#24262B' : '#EAEAEA',
        backgroundColor: isDark ? '#1B1C20' : '#EDEEF0',
      }}>
      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          borderLeftWidth: 3,
          borderLeftColor: '#725AFF',
          paddingLeft: 10,
        }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#725AFF' }}>
          {isArabic ? 'رد على' : 'Replying to'} {senderName}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            color: isDark ? '#B0B4BA' : '#80838D',
            marginTop: 2,
            textAlign: isRTL ? 'right' : 'left',
          }}>
          {preview}
        </Text>
      </Pressable>
      <Pressable onPress={onClose} hitSlop={12} style={{ padding: 8 }}>
        <XIcon color={isDark ? '#94a3b8' : '#626F7F'} />
      </Pressable>
    </View>
  );
};
