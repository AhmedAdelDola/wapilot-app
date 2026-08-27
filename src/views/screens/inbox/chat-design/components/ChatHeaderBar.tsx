import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ArrowLeft = ({ color = '#111827' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ResolveIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoreIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SnoozeIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export type ChatHeaderBarProps = {
  contactName: string;
  contactThumbnail?: string;
  conversation?: any;
  isDark: boolean;
  isArabic: boolean;
  stage: string;
  stageEmoji: string;
  onBack: () => void;
  onOpenContactDetails: () => void;
  onOpenAssignSheet: () => void;
  onOpenStageSheet: () => void;
  onOpenSnoozeSheet: () => void;
  onOpenMenuSheet: () => void;
  onToggleResolve: () => void;
  onStartCall?: () => void;
  onOpenFileViewer: (uri: string, name: string) => void;
};

export const ChatHeaderBar = ({
  contactName,
  contactThumbnail,
  conversation,
  isDark,
  isArabic,
  stage,
  stageEmoji,
  onBack,
  onOpenContactDetails,
  onOpenAssignSheet,
  onOpenStageSheet,
  onOpenSnoozeSheet,
  onOpenMenuSheet,
  onToggleResolve,
  onStartCall,
  onOpenFileViewer,
}: ChatHeaderBarProps) => {
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#374151';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';

  const isResolved = conversation?.status === 'resolved';
  const isSnoozed = conversation?.status === 'snoozed';

  return (
    <View style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
      {/* Top Header Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 14,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
          <Pressable onPress={onBack} hitSlop={12}>
            <ArrowLeft color={textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => {
              if (contactThumbnail) {
                onOpenFileViewer(contactThumbnail, contactName);
              } else {
                onOpenContactDetails();
              }
            }}
            hitSlop={4}>
            {contactThumbnail ? (
              <Image source={{ uri: contactThumbnail }} style={{ width: 38, height: 38, borderRadius: 999 }} />
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: '#d97706',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
                  {contactName ? contactName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable onPress={onOpenContactDetails} style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: textPrimary, fontSize: 16 }} numberOfLines={1}>
              {contactName}
            </Text>
          </Pressable>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {onStartCall && (
            <Pressable onPress={onStartCall} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: 6 }}>
              <PhoneIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
            </Pressable>
          )}

          <Pressable
            hitSlop={8}
            onPress={onToggleResolve}
            style={{
              padding: 6,
              backgroundColor: isResolved
                ? (isDark ? '#064e3b' : '#dcfce7')
                : (isDark ? '#334155' : '#f3f4f6'),
              borderRadius: 999,
            }}>
            <ResolveIcon color={isResolved ? '#22c55e' : (isDark ? '#94a3b8' : '#6b7280')} />
          </Pressable>

          <Pressable hitSlop={8} style={{ padding: 6 }} onPress={onOpenMenuSheet}>
            <MoreIcon color={isDark ? '#94a3b8' : '#6b7280'} />
          </Pressable>
        </View>
      </View>

      {/* Sub Header Row: Assignee, Lifecycle Stage, Snooze */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}>
        {/* Assignee Badge */}
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          onPress={onOpenAssignSheet}>
          {conversation?.meta?.assignee?.thumbnail ? (
            <Image
              source={{ uri: conversation.meta.assignee.thumbnail }}
              style={{ width: 22, height: 22, borderRadius: 999 }}
            />
          ) : (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                backgroundColor: '#14b8a6',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 10 }}>
                {conversation?.meta?.assignee?.name
                  ? conversation.meta.assignee.name.charAt(0).toUpperCase()
                  : 'U'}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 13.5, color: textSecondary, fontWeight: '500' }}>
            {conversation?.meta?.assignee?.name || 'Unassigned'}
          </Text>
          <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
        </Pressable>

        {/* Stage Badge */}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#d1d5db',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: 8,
            paddingHorizontal: 9,
            paddingVertical: 5,
            marginLeft: 'auto',
            maxWidth: '52%',
            flexShrink: 1,
          }}
          onPress={onOpenStageSheet}>
          <Text style={{ fontSize: 13 }}>{stageEmoji}</Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, fontWeight: '500', color: textPrimary, flexShrink: 1 }}>
            {stage}
          </Text>
          <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
        </Pressable>

        {/* Snooze Button */}
        <Pressable
          hitSlop={8}
          style={{
            marginLeft: 4,
            padding: 5,
            borderRadius: 8,
            backgroundColor: isSnoozed ? (isDark ? '#1e3a8a' : '#dbeafe') : 'transparent',
            borderWidth: isSnoozed ? 1 : 0,
            borderColor: isSnoozed ? (isDark ? '#2563eb' : '#93c5fd') : 'transparent',
          }}
          onPress={onOpenSnoozeSheet}>
          <SnoozeIcon color={isSnoozed ? '#2563eb' : (isDark ? '#94a3b8' : '#6b7280')} />
        </Pressable>
      </View>
    </View>
  );
};
