import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BaseSheet } from './BaseSheet';

const XIcon = ({ color = '#282E34' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ color = '#16a34a' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type LifecycleStageItem = {
  id?: number | string;
  label?: string;
  name?: string;
  emoji?: string;
  icon?: string;
};

export type LifecycleStageSheetProps = {
  isOpen: boolean;
  currentStageName?: string;
  currentStageId?: number | string | null;
  stages: LifecycleStageItem[];
  lostStages?: LifecycleStageItem[];
  isDark: boolean;
  maxHeight?: number;
  showClearSelection?: boolean;
  onClose: () => void;
  onSelectStage: (stage?: LifecycleStageItem) => void;
};

const DEFAULT_LOST_STAGES: LifecycleStageItem[] = [
  { id: 'cold_lead', label: 'Cold Lead', name: 'Cold Lead', emoji: '🧊', icon: '🧊' },
];

export const LifecycleStageSheet = ({
  isOpen,
  currentStageName,
  currentStageId,
  stages = [],
  lostStages = DEFAULT_LOST_STAGES,
  isDark,
  maxHeight = 260,
  showClearSelection = true,
  onClose,
  onSelectStage,
}: LifecycleStageSheetProps) => {
  if (!isOpen) return null;

  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#24262B' : '#EAEAEA';

  const isStageSelected = (stage: LifecycleStageItem) => {
    const stageLabel = stage.label || stage.name;
    if (currentStageId !== undefined && currentStageId !== null && stage.id !== undefined) {
      if (currentStageId === stage.id) return true;
    }
    if (currentStageName && stageLabel) {
      if (currentStageName.toLowerCase() === stageLabel.toLowerCase()) return true;
    }
    return false;
  };

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
        <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Select Stage</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Done</Text>
        </Pressable>
      </View>

      {showClearSelection && (
        <Pressable
          style={{
            width: '100%',
            alignItems: 'flex-start',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
          onPress={() => onSelectStage(undefined)}>
          <Text style={{ color: textSecondary, fontWeight: '500' }}>Clear Selection</Text>
        </Pressable>
      )}

      <Text
        style={{
          paddingHorizontal: 20,
          color: '#725AFF',
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'uppercase',
          marginTop: 8,
          marginBottom: 8,
        }}>
        Lifecycle Stages
      </Text>

      <ScrollView style={{ maxHeight }} contentContainerStyle={{ paddingBottom: 4 }}>
        {stages.map((s, idx) => {
          const label = s.label || s.name || '';
          const icon = s.emoji || s.icon || '🌱';
          const selected = isStageSelected(s);

          return (
            <Pressable
              key={s.id !== undefined ? String(s.id) : `${label}-${idx}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
              onPress={() => onSelectStage(s)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 20 }}>{icon}</Text>
                <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 15 }}>{label}</Text>
              </View>
              {selected && <CheckIcon color="#16a34a" />}
            </Pressable>
          );
        })}
      </ScrollView>

      {lostStages.length > 0 && (
        <>
          <Text
            style={{
              paddingHorizontal: 20,
              color: '#725AFF',
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
              marginTop: 8,
              marginBottom: 8,
            }}>
            Lost Stages
          </Text>
          {lostStages.map((s, idx) => {
            const label = s.label || s.name || '';
            const icon = s.emoji || s.icon || '🧊';
            const selected = isStageSelected(s);

            return (
              <Pressable
                key={s.id !== undefined ? String(s.id) : `lost-${label}-${idx}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                }}
                onPress={() => onSelectStage(s)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                  <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 15 }}>{label}</Text>
                </View>
                {selected && <CheckIcon color="#16a34a" />}
              </Pressable>
            );
          })}
        </>
      )}
      <View style={{ height: 10 }} />
    </BaseSheet>
  );
};
