import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Message } from '@/models/types';
import { getMessageText } from '../utils/chatMessageUtils';

type ChatSearchSheetProps = {
  messages: Message[];
  isDark: boolean;
  isArabic: boolean;
  onClose: () => void;
  onSelectMessage: (messageId: number) => void;
};

export const ChatSearchSheet = ({
  messages,
  isDark,
  isArabic,
  onClose,
  onSelectMessage,
}: ChatSearchSheetProps) => {
  const [query, setQuery] = useState('');
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e5e7eb';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter(m => getMessageText(m).toLowerCase().includes(q))
      .slice(0, 30);
  }, [messages, query]);

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70%',
          paddingBottom: 24,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>
            {isArabic ? 'بحث في المحادثة' : 'Search in chat'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ color: '#3b82f6', fontWeight: '600' }}>{isArabic ? 'إغلاق' : 'Close'}</Text>
          </Pressable>
        </View>
        <View
          style={{
            margin: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#334155' : '#f3f4f6',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={isArabic ? 'ابحث في الرسائل...' : 'Search messages...'}
            placeholderTextColor={textSecondary}
            style={{ flex: 1, color: textPrimary, fontSize: 14 }}
          />
        </View>
        <View style={{ paddingHorizontal: 8 }}>
          {query.trim() && results.length === 0 ? (
            <Text style={{ textAlign: 'center', color: textSecondary, paddingVertical: 24 }}>
              {isArabic ? 'لا توجد نتائج' : 'No results found'}
            </Text>
          ) : null}
          {results.map(msg => (
            <Pressable
              key={msg.id}
              onPress={() => {
                onSelectMessage(msg.id);
                onClose();
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}>
              <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 4 }}>
                {msg.sender?.name || ''}
              </Text>
              <Text numberOfLines={2} style={{ fontSize: 14, color: textPrimary }}>
                {getMessageText(msg)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};
