import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ChatReplyPreview } from './ChatReplyPreview';
import { formatMessageTime } from '../utils/chatDateUtils';
import { getMessageText } from '../utils/chatMessageUtils';
import { showToast } from '@/utils/toastUtils';
import {
  Avatar,
  C,
  getSenderName,
  getSenderThumbnail,
  IncomingMessageBubbleProps,
  isArabicString,
  LinkifiedText,
  MessageAttachmentView,
  TimeAndStatus,
} from './ChatMessageBubbleCommon';

export const IncomingMessageBubble = React.memo(
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
  }: IncomingMessageBubbleProps) => {
    const time = formatMessageTime(m.createdAt);
    const messageText = getMessageText(m);
    const isRTL = isArabicString(messageText);
    const senderName = getSenderName(m.sender);
    const senderThumbnail = getSenderThumbnail(m.sender);

    const replyMessage = useMemo(() => {
      const replyId = m.contentAttributes?.inReplyTo;
      return replyId ? messageMap?.get(replyId) : undefined;
    }, [m.contentAttributes?.inReplyTo, messageMap]);

    const handleLongPress = useCallback(() => onSetQuotedMessage?.(m), [m, onSetQuotedMessage]);

    const handleCopy = useCallback(() => {
      Clipboard.setString(messageText);
      showToast({ message: 'Message copied' });
    }, [messageText]);

    const handleAvatarPress = useCallback(() => {
      if (senderThumbnail && onOpenFileViewer) {
        onOpenFileViewer(senderThumbnail, senderName || contactName);
      }
    }, [senderThumbnail, senderName, contactName, onOpenFileViewer]);

    const handleScrollToReply = useCallback(() => {
      if (replyMessage) onScrollToMessage?.(replyMessage.id);
    }, [replyMessage, onScrollToMessage]);

    const handleLayout = useCallback(
      ({ nativeEvent }: { nativeEvent: { layout: { y: number } } }) => {
        onLayout?.(m.id, nativeEvent.layout.y);
      },
      [m.id, onLayout],
    );

    const bubbleBg = isDark ? C.incoming.bgDark : C.incoming.bgLight;
    const textColor = isDark ? C.incoming.textDark : C.incoming.textLight;

    return (
      <View
        onLayout={onLayout ? handleLayout : undefined}
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
          gap: 6,
          marginTop: 5,
          paddingHorizontal: 12,
        }}>
        <Avatar sender={m.sender} isOutgoing={false} isDark={isDark} contactName={contactName} onPress={handleAvatarPress} />

        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityLabel={`Message from ${senderName || contactName}: ${messageText}`}
          style={{
            maxWidth: '78%',
            alignSelf: 'flex-start',
            backgroundColor: bubbleBg,
            borderWidth: 1,
            borderColor: isDark ? C.incoming.borderDark : C.incoming.border,
            borderRadius: 16,
            borderBottomRightRadius: 16,
            borderBottomLeftRadius: 4,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}>
          {replyMessage && (
            <ChatReplyPreview
              replyMessage={replyMessage}
              isOutgoing={false}
              isDark={isDark}
              onPress={handleScrollToReply}
            />
          )}

          {conversation?.isGroup && senderName ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#725AFF', marginBottom: 2 }}>
              {senderName}
            </Text>
          ) : null}

          {m.attachments?.length > 0 &&
            m.attachments.map((att, aIdx) => (
              <MessageAttachmentView key={aIdx} attachment={att} isDark={isDark} isOutgoing={false} onOpenFile={onOpenFileViewer || (() => {})} />
            ))}

          {messageText ? (
            <LinkifiedText text={messageText} color={textColor} textAlign={isRTL ? 'right' : 'left'} />
          ) : null}

          {time ? <TimeAndStatus time={time} isOutgoing={false} isDark={isDark} message={m} /> : null}
        </Pressable>

        {highlightedMessageId === m.id && (
          <View pointerEvents="none" style={{ position: 'absolute', inset: -2, borderWidth: 2, borderColor: C.highlight, borderRadius: 18 }} />
        )}
      </View>
    );
  },
);
