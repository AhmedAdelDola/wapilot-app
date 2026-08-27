/* eslint-disable react/display-name */
import React, { memo, useCallback, useMemo } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useRefsContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Conversation } from '@/models/types';
import {
  toggleSelection,
  selectSelected,
  selectSingleConversation,
  clearSelection,
} from '@/viewmodels/store/conversation/conversationSelectedSlice';
import { selectCurrentState, setCurrentState } from '@/viewmodels/store/conversation/conversationHeaderSlice';
import { setActionState } from '@/viewmodels/store/conversation/conversationActionSlice';
import { selectInboxById } from '@/viewmodels/store/inbox/inboxSelectors';
import { selectContactById } from '@/viewmodels/store/contact/contactSelectors';
import { selectTypingUsersByConversationId } from '@/viewmodels/store/conversation/conversationTypingSlice';
import { conversationActions } from '@/viewmodels/store/conversation/conversationActions';
import { selectAllLabels } from '@/viewmodels/store/label/labelSelectors';
import { LifecycleStage } from '@/models/services/profileService';

import { isContactTyping, getLastMessage, getTypingUsersText } from '@/utils';
import { Icon, Swipeable } from '@/views/components/common';

import { ConversationItem } from './ConversationItem';
import { MarkAsUnRead, StatusIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { MarkAsRead } from '@/svg-icons';
import i18n from '@/i18n';

type ConversationItemContainerProps = {
  conversationItem: Conversation;
  index: number;
  openedRowIndex: SharedValue<number | null>;
  lifecycleStages?: LifecycleStage[];
};

const ReadComponent = React.memo(() => {
  return (
    <Animated.View style={tailwind.style('flex justify-center items-center')}>
      <Icon icon={<MarkAsRead />} size={24} />
    </Animated.View>
  );
});

const UnreadComponent = React.memo(() => {
  return (
    <Animated.View style={tailwind.style('flex justify-center items-center')}>
      <Icon icon={<MarkAsUnRead />} size={24} />
    </Animated.View>
  );
});

const StatusComponent = React.memo(() => {
  return (
    <Animated.View style={tailwind.style('flex justify-center items-center ')}>
      <Icon icon={<StatusIcon />} size={24} />
      <Animated.Text style={tailwind.style('text-sm font-inter-420-20 pt-[3px] text-white')}>
        {i18n.t('CONVERSATION.ITEM.STATUS')}
      </Animated.Text>
    </Animated.View>
  );
});

export const ConversationItemContainer = memo((props: ConversationItemContainerProps) => {
  const { conversationItem, index, openedRowIndex, lifecycleStages = [] } = props;
  const {
    meta: {
      sender: { name: senderName, thumbnail: senderThumbnail, id: contactId },
      assignee,
    },
    id,
    priority,
    unreadCount,
    labels,
    timestamp,
    inboxId,
    lastNonActivityMessage,
    slaPolicyId,
    appliedSla,
    firstReplyCreatedAt,
    waitingSince,
    status,
    additionalAttributes,
  } = conversationItem;

  // Hooks
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { actionsModalSheetRef } = useRefsContext();

  // Selectors
  const allLabels = useAppSelector(selectAllLabels);
  const contact = useAppSelector(state => selectContactById(state, contactId));
  const inbox = useAppSelector(state => selectInboxById(state, inboxId));
  const typingUsers = useAppSelector(selectTypingUsersByConversationId(id));
  const selected = useAppSelector(selectSelected);
  const currentState = useAppSelector(selectCurrentState);

  const { availabilityStatus, name: contactName, thumbnail: contactThumbnail } = contact || {};
  const isSelected = useMemo(() => id in selected, [selected, id]);
  const isTyping = useMemo(() => isContactTyping(typingUsers, contactId), [typingUsers, contactId]);
  const typingText = useMemo(() => getTypingUsersText({ users: typingUsers }), [typingUsers]);

  const lastMessage = getLastMessage(conversationItem);
  const senderData = conversationItem.meta?.sender as any;
  const contactData = contact as any;
  const rawLifecycleStageId =
    contactData?.lifecycle_stage_id ??
    contactData?.customAttributes?.lifecycle_stage_id ??
    contactData?.custom_attributes?.lifecycle_stage_id ??
    senderData?.lifecycle_stage_id ??
    senderData?.customAttributes?.lifecycle_stage_id ??
    senderData?.custom_attributes?.lifecycle_stage_id;
  const rawLifecycleStageName =
    contactData?.customAttributes?.lifecycle_stage ??
    contactData?.custom_attributes?.lifecycle_stage ??
    senderData?.customAttributes?.lifecycle_stage ??
    senderData?.custom_attributes?.lifecycle_stage;
  const lifecycleStageFromApi =
    contactData?.lifecycleStage ??
    contactData?.lifecycle_stage ??
    senderData?.lifecycleStage ??
    senderData?.lifecycle_stage;
  const lifecycleStage = useMemo(() => {
    if (lifecycleStageFromApi?.name) {
      return {
        name: lifecycleStageFromApi.name,
        icon: lifecycleStageFromApi.icon || '🌱',
      };
    }
    const normalizedName = String(rawLifecycleStageName ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, ' ');
    const stage = lifecycleStages.find(candidate =>
      String(candidate.id) === String(rawLifecycleStageId) ||
      candidate.name.trim().toLowerCase().replace(/[\s_-]+/g, ' ') === normalizedName,
    );
    if (stage) return { name: stage.name, icon: stage.icon };
    if (normalizedName) return { name: String(rawLifecycleStageName).replace(/_/g, ' '), icon: '🌱' };
    return null;
  }, [lifecycleStageFromApi, lifecycleStages, rawLifecycleStageId, rawLifecycleStageName]);
  const isWhatsAppConversation = Object.keys({
    ...(senderData?.customAttributes || {}),
    ...(senderData?.custom_attributes || {}),
  }).some(key => key.toLowerCase().includes('whatsapp'));

  const markMessageReadOrUnread = useCallback(() => {
    if (unreadCount > 0) {
      dispatch(conversationActions.markMessageRead({ conversationId: id }));
    } else {
      dispatch(conversationActions.markMessagesUnread({ conversationId: id }));
    }
  }, [dispatch, id, unreadCount]);

  const onStatusAction = useCallback(() => {
    dispatch(selectSingleConversation(conversationItem));
    dispatch(setActionState('Status'));
    actionsModalSheetRef.current?.present();
  }, [dispatch, conversationItem, actionsModalSheetRef]);

  const onLongPressAction = useCallback(() => {
    dispatch(clearSelection());
    dispatch(setCurrentState('Select'));
  }, [dispatch]);

  const onPressAction = useCallback(() => {
    if (currentState === 'Select') {
      dispatch(toggleSelection({ conversation: conversationItem }));
    } else {
      const pushToChatScreen = StackActions.push('ChatScreen', {
        conversationId: id,
        isConversationOpenedExternally: false,
      });
      navigation.dispatch(pushToChatScreen);
    }
  }, [currentState, dispatch, conversationItem, navigation, id]);

  const viewProps = {
    id,
    senderName: contactName || senderName,
    senderThumbnail: contactThumbnail || senderThumbnail,
    isSelected,
    currentState,
    unreadCount,
    isTyping,
    availabilityStatus: availabilityStatus || 'offline',
    priority,
    labels,
    timestamp,
    inbox: inbox || null,
    channelType: (inbox?.channelType || conversationItem.meta?.channel || '') as string,
    medium: inbox?.medium || (isWhatsAppConversation ? 'whatsapp' : ''),
    provider: inbox?.provider || '',
    lastNonActivityMessage,
    lastMessage,
    inboxId,
    assignee: assignee || null,
    slaPolicyId,
    appliedSla: appliedSla || null,
    appliedSlaConversationDetails: {
      firstReplyCreatedAt,
      waitingSince,
      status,
    },
    additionalAttributes,
    allLabels,
    typingText: typingText as string | undefined,
    lifecycleStage,
  };

  return (
    <Swipeable
      spacing={27}
      leftElement={unreadCount > 0 ? <ReadComponent /> : <UnreadComponent />}
      rightElement={<StatusComponent />}
      handleLeftElementPress={markMessageReadOrUnread}
      handleOnLeftOverswiped={markMessageReadOrUnread}
      handleRightElementPress={onStatusAction}
      handleOnRightOverswiped={onStatusAction}
      handleLongPress={onLongPressAction}
      handlePress={onPressAction}
      triggerOverswipeOnFlick
      {...{ index, openedRowIndex }}>
      <ConversationItem {...viewProps} />
    </Swipeable>
  );
});
