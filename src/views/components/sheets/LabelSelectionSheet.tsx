import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { BaseSheet } from './BaseSheet';

const XIcon = ({ color = '#282E34' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SearchIcon = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={2} />
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckIcon = ({ color = '#725AFF', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type LabelItem = {
  id: number | string;
  title: string;
  color?: string;
  description?: string;
};

export type LabelSelectionSheetProps = {
  isOpen: boolean;
  title?: string;
  placeholder?: string;
  selectedLabels: string[];
  availableLabels: LabelItem[];
  isDark: boolean;
  maxHeight?: number;
  onClose: () => void;
  onToggleLabel: (labelTitle: string) => void;
};

export const LabelSelectionSheet = ({
  isOpen,
  title = 'Conversation Labels',
  placeholder = 'Search labels...',
  selectedLabels = [],
  availableLabels = [],
  isDark,
  maxHeight = 280,
  onClose,
  onToggleLabel,
}: LabelSelectionSheetProps) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#24262B' : '#EAEAEA';

  const filtered = availableLabels.filter(lbl => {
    if (!search.trim()) return true;
    return (lbl.title || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <BaseSheet onClose={onClose} isDark={isDark}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <Pressable onPress={onClose} hitSlop={8}>
          <XIcon color={textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Done</Text>
        </Pressable>
      </View>

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: isDark ? '#24262B' : '#F0F0F3',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}>
        <SearchIcon color={textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
          style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <XIcon color={textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={{ maxHeight }}>
        {filtered.length > 0 ? (
          filtered.map(lbl => {
            const isSelected = selectedLabels.some(
              l => typeof l === 'string' && l.toLowerCase() === lbl.title.toLowerCase(),
            );

            return (
              <Pressable
                key={lbl.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                }}
                onPress={() => onToggleLabel(lbl.title)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: lbl.color || '#725AFF',
                    }}
                  />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: textPrimary }}>{lbl.title}</Text>
                </View>
                {isSelected && <CheckIcon color="#725AFF" size={20} />}
              </Pressable>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
            <Text style={{ color: textSecondary, fontWeight: '500' }}>
              {search ? 'No matching labels' : 'No account labels found'}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={{ height: 8 }} />
    </BaseSheet>
  );
};
