import React from 'react';
import Animated from 'react-native-reanimated';
import { Avatar } from '@/views/components';
import { tailwind } from '@/theme';
import type { NotificationType } from '@/models/types/Notification';
import { ConversationPriority } from '@/models/types/common';
import { AnimatedNativeView, NativeView } from '@/views/components/native-components';
import { PriorityIndicator, ChannelIndicator } from '@/views/components/list-components';

import { Inbox } from '@/models/types/Inbox';
import { ConversationAdditionalAttributes } from '@/models/types/Conversation';
import { NotificationTypeIndicator } from './NotificationTypeIndicator';
import { Dimensions } from 'react-native';
import { useTheme } from '@/theme';

type InboxItemProps = {
  isRead: boolean;
  conversationId: number;
  sender: {
    name: string;
    thumbnail: string;
  };
  assignee: {
    name: string;
    thumbnail: string;
  };
  lastActivityAt: () => string;
  priority?: ConversationPriority | null;
  inbox: Inbox | null;
  additionalAttributes: ConversationAdditionalAttributes;
  pushMessageTitle: string;
  notificationType: NotificationType;
};

const { width } = Dimensions.get('screen');

export const InboxItemComponent = (props: InboxItemProps) => {
  const {
    isRead,
    inbox,
    assignee,
    conversationId,
    sender,
    lastActivityAt,
    priority,
    additionalAttributes,
    pushMessageTitle,
    notificationType,
  } = props;

  const hasAssignee = assignee?.name || assignee?.thumbnail;
  const { isDark } = useTheme();

  const titleColor = isRead
    ? (isDark ? '#94a3b8' : '#6b7280')
    : (isDark ? '#f8fafc' : '#030712');

  const subtitleColor = isRead
    ? (isDark ? '#64748b' : '#9ca3af')
    : (isDark ? '#cbd5e1' : '#374151');

  const metaColor = isDark ? '#64748b' : '#9ca3af';

  return (
    <Animated.View
      style={{
        paddingLeft: 16,
        paddingVertical: 14,
        paddingRight: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1e293b' : '#f3f4f6',
      }}>
      <Animated.View style={{}}>
        <AnimatedNativeView
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 24 }}>
          <AnimatedNativeView
            style={{ flexDirection: 'row', alignItems: 'center', height: 24, gap: 6 }}>
            {!isRead && (
              <Animated.View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: '#3b82f6',
                  marginRight: 2,
                }}
              />
            )}
            <Animated.Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontFamily: isRead ? 'Inter-400-20' : 'Inter-500-24',
                fontWeight: isRead ? '500' : '700',
                letterSpacing: 0.2,
                color: titleColor,
                textTransform: 'capitalize',
                maxWidth: width - 250,
              }}>
              {sender.name || ''}
            </Animated.Text>
            <NativeView style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Animated.Text style={{ fontSize: 13, fontFamily: 'Inter-400-20', color: metaColor }}>
                #
              </Animated.Text>
              <Animated.Text style={{ fontSize: 13, fontFamily: 'Inter-400-20', color: metaColor }}>
                {conversationId}
              </Animated.Text>
            </NativeView>
          </AnimatedNativeView>
          <AnimatedNativeView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {priority ? <PriorityIndicator {...{ priority }} /> : null}
            {inbox && (
              <ChannelIndicator inbox={inbox} additionalAttributes={additionalAttributes} />
            )}
            <NativeView>
              <Animated.Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter-400-20',
                  color: metaColor,
                }}>
                {lastActivityAt()}
              </Animated.Text>
            </NativeView>
          </AnimatedNativeView>
        </AnimatedNativeView>

        <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
            {hasAssignee && (
              <Avatar
                src={assignee.thumbnail ? { uri: assignee.thumbnail } : undefined}
                size="md"
                name={assignee?.name || ''}
              />
            )}

            <Animated.Text
              style={{
                fontFamily: 'Inter-400-20',
                fontSize: 14,
                color: subtitleColor,
                lineHeight: 18,
                flexShrink: 1,
              }}
              numberOfLines={1}
              ellipsizeMode="tail">
              {pushMessageTitle}
            </Animated.Text>
          </Animated.View>
          <NotificationTypeIndicator type={notificationType} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

InboxItemComponent.displayName = 'InboxItem';
export const InboxItem = React.memo(InboxItemComponent);
