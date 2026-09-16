import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { BaseSheet } from './BaseSheet';

const SnoozeIcon = ({ color = '#725AFF' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
    <Polyline points="12 7 12 12 15 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = ({ color = '#282E34' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type SnoozeOption = {
  id: string;
  label: string;
  desc: string;
  icon: string;
  getTimestamp?: () => number | null;
  snoozedUntil?: number | null;
};

export type SnoozeConversationSheetProps = {
  isOpen: boolean;
  contactName?: string;
  isSnoozed?: boolean;
  isDark: boolean;
  isArabic: boolean;
  onClose: () => void;
  onReopen?: () => Promise<void> | void;
  onSnooze: (snoozedUntil: number | null, label: string) => Promise<void> | void;
  onCustomSnooze?: (timestamp: number) => Promise<void> | void;
};

export const SnoozeConversationSheet = ({
  isOpen,
  contactName = 'Customer',
  isSnoozed = false,
  isDark,
  isArabic,
  onClose,
  onReopen,
  onSnooze,
  onCustomSnooze,
}: SnoozeConversationSheetProps) => {
  const [customSnoozeOpen, setCustomSnoozeOpen] = useState(false);
  const [customSnoozeDateText, setCustomSnoozeDateText] = useState('');
  const [customSnoozeTimeText, setCustomSnoozeTimeText] = useState('');

  if (!isOpen) return null;

  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#24262B' : '#EAEAEA';

  const defaultOptions: SnoozeOption[] = [
    {
      id: 'next_reply',
      label: isArabic ? 'حتى الرد التالي' : 'Until Next Reply',
      desc: isArabic ? 'يتم إلغاء التأجيل بمجرد وصول رسالة من العميل' : 'Snooze until the customer responds',
      icon: '💬',
      snoozedUntil: null,
    },
    {
      id: 'tomorrow',
      label: isArabic ? 'غداً صباحاً (9:00 ص)' : 'Tomorrow Morning (9:00 AM)',
      desc: isArabic ? 'تأجيل حتى صباح الغد' : 'Snooze until 9:00 AM tomorrow',
      icon: '☀️',
      getTimestamp: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
      },
    },
    {
      id: '2_hours',
      label: isArabic ? 'بعد ساعتين' : 'In 2 Hours',
      desc: isArabic ? 'تأجيل لمدة ساعتين' : 'Snooze for 2 hours',
      icon: '⏱️',
      getTimestamp: () => Math.floor((Date.now() + 2 * 3600 * 1000) / 1000),
    },
    {
      id: 'next_week',
      label: isArabic ? 'الأسبوع القادم (الإثنين 9:00 ص)' : 'Next Week (Monday 9:00 AM)',
      desc: isArabic ? 'تأجيل حتى بداية الأسبوع القادم' : 'Snooze until next Monday',
      icon: '📅',
      getTimestamp: () => {
        const d = new Date();
        d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
        d.setHours(9, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
      },
    },
  ];

  const handleCustomSubmit = () => {
    const rawDate = customSnoozeDateText.trim();
    const rawTime = customSnoozeTimeText.trim();
    if (!rawDate) return;

    let target: Date;
    if (rawTime) {
      target = new Date(`${rawDate}T${rawTime}:00`);
    } else {
      target = new Date(`${rawDate}T09:00:00`);
    }

    if (isNaN(target.getTime())) return;
    const epochSec = Math.floor(target.getTime() / 1000);

    if (onCustomSnooze) {
      onCustomSnooze(epochSec);
    } else {
      onSnooze(epochSec, `${rawDate} ${rawTime || '09:00'}`);
    }
  };

  return (
    <BaseSheet onClose={onClose} isDark={isDark}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SnoozeIcon color="#725AFF" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary }}>
              {isArabic ? 'تأجيل المحادثة' : 'Snooze Conversation'}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <XIcon color={textPrimary} />
          </Pressable>
        </View>

        <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>
          {isArabic
            ? `سيتم إخفاء المحادثة مع ${contactName} مؤقتاً حتى الوقت المحدد أو حتى يرسل العميل رداً جديداً.`
            : `Temporarily snooze conversation with ${contactName} until selected time or until next customer reply.`}
        </Text>

        <View style={{ gap: 8, paddingBottom: 24 }}>
          {isSnoozed && onReopen && (
            <Pressable
              onPress={onReopen}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDark ? '#1B1C20' : 'rgba(44,165,74,0.15)',
                borderWidth: 1.5,
                borderColor: '#2CA54A',
                marginBottom: 4,
              }}>
              <Text style={{ fontSize: 20 }}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#6ee7b7' : '#047857', marginBottom: 2 }}>
                  {isArabic ? 'إلغاء التأجيل وفتح المحادثة' : 'Reopen Conversation (Un-snooze)'}
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#a7f3d0' : '#065f46' }}>
                  {isArabic ? 'إعادة المحادثة فوراً إلى صندوق المحادثات المفتوحة' : 'Move conversation back to open inbox immediately'}
                </Text>
              </View>
            </Pressable>
          )}

          {defaultOptions.map(opt => (
            <Pressable
              key={opt.id}
              onPress={() => {
                const ts = opt.getTimestamp ? opt.getTimestamp() : (opt.snoozedUntil ?? null);
                onSnooze(ts, opt.label);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDark ? '#1B1C20' : '#EDEEF0',
                borderWidth: 1,
                borderColor,
              }}>
              <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimary, marginBottom: 2 }}>
                  {opt.label}
                </Text>
                <Text style={{ fontSize: 12, color: textSecondary }}>
                  {opt.desc}
                </Text>
              </View>
            </Pressable>
          ))}

          <Pressable
            onPress={() => {
              const initialDate = new Date(Date.now() + 60 * 60 * 1000);
              setCustomSnoozeDateText(initialDate.toISOString().slice(0, 10));
              setCustomSnoozeTimeText(initialDate.toTimeString().slice(0, 5));
              setCustomSnoozeOpen(!customSnoozeOpen);
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: isDark ? '#1B1C20' : 'rgba(44,165,74,0.15)',
              borderWidth: 1,
              borderColor: '#725AFF',
            }}>
            <Text style={{ color: '#725AFF', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
              {isArabic ? 'اختيار تاريخ ووقت' : 'Pick Date & Time'}
            </Text>
          </Pressable>

          {customSnoozeOpen && (
            <View style={{ gap: 8, marginTop: 8 }}>
              <TextInput
                value={customSnoozeDateText}
                onChangeText={setCustomSnoozeDateText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
                keyboardType="numbers-and-punctuation"
                style={{
                  color: textPrimary,
                  backgroundColor: isDark ? '#24262B' : '#F0F0F3',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  textAlign: 'center',
                }}
              />
              <TextInput
                value={customSnoozeTimeText}
                onChangeText={setCustomSnoozeTimeText}
                placeholder="HH:MM"
                placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
                keyboardType="numbers-and-punctuation"
                style={{
                  color: textPrimary,
                  backgroundColor: isDark ? '#24262B' : '#F0F0F3',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  textAlign: 'center',
                }}
              />
              <Pressable
                onPress={handleCustomSubmit}
                style={{ paddingVertical: 11, borderRadius: 8, backgroundColor: '#725AFF' }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                  {isArabic ? 'تأكيد التأجيل' : 'Confirm Snooze'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </BaseSheet>
  );
};
