import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Message } from '@/models/types';
import { getMessageText } from '../utils/chatMessageUtils';

type ChatReplyPreviewProps = {
  replyMessage: Message;
  isOutgoing: boolean;
  isDark: boolean;
  onPress?: () => void;
};

export const ChatReplyPreview = ({
  replyMessage,
  isOutgoing,
  isDark,
  onPress,
}: ChatReplyPreviewProps) => {
  const previewText = getMessageText(replyMessage);
  const attachment = replyMessage.attachments?.[0];
  const senderName = replyMessage.sender?.name || 'Unknown';

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: isOutgoing ? 'rgba(255,255,255,0.55)' : '#725AFF',
        paddingLeft: 8,
        marginBottom: 6,
        opacity: 0.95,
      }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: isOutgoing ? 'rgba(255,255,255,0.9)' : isDark ? '#725AFF' : '#725AFF',
          marginBottom: 2,
        }}>
        {senderName}
      </Text>
      {previewText ? (
        <Text
          numberOfLines={2}
          style={{
            fontSize: 12,
            color: isOutgoing ? 'rgba(255,255,255,0.8)' : isDark ? '#B0B4BA' : '#80838D',
          }}>
          {previewText}
        </Text>
      ) : attachment ? (
        <Text
          style={{
            fontSize: 12,
            color: isOutgoing ? 'rgba(255,255,255,0.8)' : isDark ? '#B0B4BA' : '#80838D',
          }}>
          {attachment.fileType || 'Attachment'}
        </Text>
      ) : null}
    </Pressable>
  );
};
