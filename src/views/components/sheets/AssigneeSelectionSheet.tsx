import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

export type AssignableAgent = {
  id: number;
  name?: string;
  available_name?: string;
  thumbnail?: string;
};

export type AssigneeSelectionSheetProps = {
  isOpen: boolean;
  currentAssigneeId?: number | null;
  currentUserId?: number;
  assignableAgents: AssignableAgent[];
  isDark: boolean;
  onClose: () => void;
  onAssignToMe: () => void;
  onUnassign: () => void;
  onAssignAgent: (agentId: number, agentName: string) => void;
};

export const AssigneeSelectionSheet = ({
  isOpen,
  currentAssigneeId,
  currentUserId,
  assignableAgents = [],
  isDark,
  onClose,
  onAssignToMe,
  onUnassign,
  onAssignAgent,
}: AssigneeSelectionSheetProps) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#24262B' : '#EAEAEA';

  const filteredAgents = assignableAgents.filter(ag => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const aname = (ag.name || ag.available_name || '').toLowerCase();
    return aname.includes(q);
  });

  return (
    <BaseSheet onClose={onClose} isDark={isDark}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={onClose} hitSlop={8}>
          <XIcon color={textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Assign User</Text>
        <View style={{ width: 24 }} />
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
          placeholder="Search agents..."
          placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
          style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <XIcon color={textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Assign to me option */}
      {currentUserId !== undefined && (
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
          onPress={onAssignToMe}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ position: 'relative', width: 36, height: 36, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Me</Text>
              <View style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 999, backgroundColor: '#2CA54A', borderWidth: 2, borderColor: isDark ? '#1B1C20' : '#fff' }} />
            </View>
            <Text style={{ color: textPrimary, fontWeight: '500' }}>Assign to me</Text>
          </View>
          {currentAssigneeId === currentUserId && <CheckIcon />}
        </Pressable>
      )}

      {/* Unassign option */}
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
        onPress={onUnassign}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: isDark ? '#24262B' : 'rgba(114,90,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={8} r={4} fill={isDark ? '#94a3b8' : '#725AFF'} />
              <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={isDark ? '#94a3b8' : '#725AFF'} />
            </Svg>
          </View>
          <Text style={{ color: textPrimary, fontWeight: '500' }}>Unassign</Text>
        </View>
        {!currentAssigneeId && <CheckIcon />}
      </Pressable>

      {/* Agents list */}
      {filteredAgents.length > 0 && (
        <ScrollView style={{ maxHeight: 240 }}>
          {filteredAgents.map(ag => {
            const agentName = ag.name || ag.available_name || 'Agent';
            return (
              <Pressable
                key={ag.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: borderColor,
                }}
                onPress={() => onAssignAgent(ag.id, agentName)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {ag.thumbnail ? (
                    <Image source={{ uri: ag.thumbnail }} style={{ width: 32, height: 32, borderRadius: 999 }} />
                  ) : (
                    <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                        {agentName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>{agentName}</Text>
                </View>
                {currentAssigneeId === ag.id && <CheckIcon size={18} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <View style={{ height: 8 }} />
    </BaseSheet>
  );
};
