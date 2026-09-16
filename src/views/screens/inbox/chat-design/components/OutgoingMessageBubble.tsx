import React, { useCallback, useMemo } from 'react';
import { Clipboard, Pressable, View } from 'react-native';
import { ChatReplyPreview } from './ChatReplyPreview';
import { formatMessageTime } from '../utils/chatDateUtils';
import { getMessageText } from '../utils/chatMessageUtils';
import { showToast } from '@/utils/toastUtils';
import {
  Avatar,
  BUBBLE_COLORS,
  getSenderName,
  isArabicString,
  LinkifiedText,
  MessageAttachmentView,
  OutgoingMessageBubbleProps,
  TimeAndStatus,
} from './ChatMessageBubbleCommon';

export const OutgoingMessageBubble = React.memo(
  ({
    message: m,
    index,
    isDark,
    isArabic,
    contactName,
    conversation,
    messageMap,
    highlightedMessageId,
    onLayout,
    onScrollToMessage,
    onSetQuotedMessage,
    onOpenFileViewer,
    onRetryMessage,
  }: OutgoingMessageBubbleProps) => {
    const time = formatMessageTime(m.createdAt);
    const messageText = getMessageText(m);
    const isRTL = isArabicString(messageText);
    const senderName = getSenderName(m.sender);

    const replyMessage = useMemo(() => {
      const replyId = m.contentAttributes?.inReplyTo;
      return replyId ? messageMap?.get(replyId) : undefined;
    }, [m.contentAttributes?.inReplyTo, messageMap]);

    const handleLongPress = useCallback(() => onSetQuotedMessage?.(m), [m, onSetQuotedMessage]);

    const handleCopy = useCallback(() => {
      Clipboard.setString(messageText);
      showToast({ message: 'Message copied' });
    }, [messageText]);

    const handleRetry = useCallback(() => onRetryMessage?.(m), [m, onRetryMessage]);

    const handleScrollToReply = useCallback(() => {
      if (replyMessage) onScrollToMessage?.(replyMessage.id);
    }, [replyMessage, onScrollToMessage]);

    const handleLayout = useCallback(
      ({ nativeEvent }: { nativeEvent: { layout: { y: number } } }) => {
        onLayout?.(m.id, nativeEvent.layout.y);
      },
      [m.id, onLayout],
    );

    const bubbleBg = BUBBLE_COLORS.outgoing.bg;
    const textColor = BUBBLE_COLORS.outgoing.text;

    return (
      <View
        onLayout={onLayout ? handleLayout : undefined}
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          gap: 6,
          marginTop: 5,
          paddingHorizontal: 8,
        }}>
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          accessibilityRole="text"
          accessibilityLabel={`Message from ${senderName || contactName}: ${messageText}`}
          style={{
            maxWidth: '82%',
            minWidth: 70,
            flexShrink: 1,
            alignSelf: 'flex-end',
            backgroundColor: bubbleBg,
            borderWidth: 0,
            borderRadius: 16,
            borderBottomRightRadius: 4,
            borderBottomLeftRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}>
          {replyMessage && (
            <ChatReplyPreview
              replyMessage={replyMessage}
              isOutgoing={true}
              isDark={isDark}
              onPress={handleScrollToReply}
            />
          )}

          {m.attachments?.length > 0 &&
            m.attachments.map((att, aIdx) => (
              <MessageAttachmentView
                key={aIdx}
                attachment={att}
                isDark={isDark}
                isOutgoing={true}
                onOpenFile={onOpenFileViewer || (() => {})}
              />
            ))}

          {messageText ? (
            <View style={{ width: '100%' }}>
              <LinkifiedText
                text={messageText}
                color={textColor}
                linkColor="#e0e7ff"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          ) : null}

          {time ? (
            <TimeAndStatus
              time={time}
              isOutgoing={true}
              isDark={isDark}
              message={m}
              onRetry={handleRetry}
            />
          ) : null}
        </Pressable>

        {m.sender ? (
          <Avatar sender={m.sender} isOutgoing={true} isDark={isDark} contactName={contactName} />
        ) : null}

        {highlightedMessageId === m.id && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: -2,
              borderWidth: 2,
              borderColor: BUBBLE_COLORS.highlight,
              borderRadius: 18,
            }}
          />
        )}
      </View>
    );
  },
);
