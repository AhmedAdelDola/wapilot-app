import React from 'react';
import { View } from 'react-native';
import { isActivityMessage, isOutgoingMessage, isPrivateMessage } from '../utils/chatMessageUtils';
import { formatMessageTime } from '../utils/chatDateUtils';
import { getMessageText } from '../utils/chatMessageUtils';
import { isArabicString, getSenderName } from './ChatMessageBubbleCommon';
import { DateHeader, ActivityMessage, PrivateNote } from './ChatMessageBubbleCommon';
import { IncomingMessageBubble } from './IncomingMessageBubble';
import { OutgoingMessageBubble } from './OutgoingMessageBubble';
import type { ChatMessageBubbleProps } from './ChatMessageBubbleCommon';

export * from './ChatMessageBubbleCommon';
export { IncomingMessageBubble } from './IncomingMessageBubble';
export { OutgoingMessageBubble } from './OutgoingMessageBubble';

// ── Main Bubble Component (Dispatcher) ───────────────────────────────

export const ChatMessageBubble = React.memo(
  ({
    message: m,
    index,
    isDark,
    isArabic,
    contactName,
    conversation,
    messageMap,
    highlightedMessageId,
    showDateHeader,
    onLayout,
    onScrollToMessage,
    onSetQuotedMessage,
    onOpenFileViewer,
    onRetryMessage,
  }: ChatMessageBubbleProps) => {
    const isActivity = isActivityMessage(m);
    const isPrivateMsg = isPrivateMessage(m);
    const isOutgoing = !isActivity && isOutgoingMessage(m);
    const time = formatMessageTime(m.createdAt);
    const messageText = getMessageText(m);
    const isRTL = isArabicString(messageText);
    const senderName = getSenderName(m.sender);

    // ── Date Header ──
    if (showDateHeader) {
      return (
        <View style={{ width: '100%' }} accessibilityRole="text">
          <DateHeader date={m.createdAt} isDark={isDark} isArabic={isArabic} />
        </View>
      );
    }

    // ── Activity ──
    if (isActivity) {
      return (
        <View style={{ width: '100%' }} accessibilityRole="text">
          <ActivityMessage text={messageText} time={time} isDark={isDark} />
        </View>
      );
    }

    // ── Private Note ──
    if (isPrivateMsg) {
      return (
        <View style={{ width: '100%' }}>
          <PrivateNote
            messageText={messageText}
            time={time}
            isDark={isDark}
            isRTL={isRTL}
            senderName={senderName}
            attachments={m.attachments || []}
            onOpenFileViewer={onOpenFileViewer}
          />
        </View>
      );
    }

    // ── Outgoing Bubble ──
    if (isOutgoing) {
      return (
        <OutgoingMessageBubble
          message={m}
          index={index}
          isDark={isDark}
          isArabic={isArabic}
          contactName={contactName}
          conversation={conversation}
          messageMap={messageMap}
          highlightedMessageId={highlightedMessageId}
          onLayout={onLayout}
          onScrollToMessage={onScrollToMessage}
          onSetQuotedMessage={onSetQuotedMessage}
          onOpenFileViewer={onOpenFileViewer}
          onRetryMessage={onRetryMessage}
        />
      );
    }

    // ── Incoming Bubble ──
    return (
      <IncomingMessageBubble
        message={m}
        index={index}
        isDark={isDark}
        isArabic={isArabic}
        contactName={contactName}
        conversation={conversation}
        messageMap={messageMap}
        highlightedMessageId={highlightedMessageId}
        onLayout={onLayout}
        onScrollToMessage={onScrollToMessage}
        onSetQuotedMessage={onSetQuotedMessage}
        onOpenFileViewer={onOpenFileViewer}
      />
    );
  },
);
