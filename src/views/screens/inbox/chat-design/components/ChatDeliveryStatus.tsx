import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MESSAGE_STATUS, MESSAGE_TYPES } from '@/constants';
import type { Message } from '@/models/types';

type ChatDeliveryStatusProps = {
  message: Message;
  isOutgoing: boolean;
  isDark: boolean;
  onRetry?: () => void;
};

export const ChatDeliveryStatus = ({
  message,
  isOutgoing,
  isDark,
  onRetry,
}: ChatDeliveryStatusProps) => {
  if (!isOutgoing || message.private) return null;

  const status = message.status;
  const isTemplate = message.messageType === MESSAGE_TYPES.TEMPLATE;

  if (!isOutgoing && !isTemplate) return null;

  if (status === MESSAGE_STATUS.PROGRESS) {
    return (
      <ActivityIndicator
        size="small"
        color="rgba(255,255,255,0.7)"
        style={{ marginLeft: 4, transform: [{ scale: 0.65 }] }}
      />
    );
  }

  if (status === MESSAGE_STATUS.FAILED) {
    return (
      <Pressable onPress={onRetry} hitSlop={8} style={{ marginLeft: 4 }}>
        <Text style={{ fontSize: 11, color: '#fca5a5', fontWeight: '700' }}>!</Text>
      </Pressable>
    );
  }

  const tickColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.85)';
  const doubleTickColor =
    status === MESSAGE_STATUS.READ ? '#93c5fd' : tickColor;

  if (status === MESSAGE_STATUS.DELIVERED || status === MESSAGE_STATUS.READ) {
    return (
      <Text style={{ fontSize: 11, color: doubleTickColor, marginLeft: 3, fontWeight: '700' }}>
        ✓✓
      </Text>
    );
  }

  if (status === MESSAGE_STATUS.SENT) {
    return (
      <Text style={{ fontSize: 11, color: tickColor, marginLeft: 3, fontWeight: '700' }}>✓</Text>
    );
  }

  return null;
};
