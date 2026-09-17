import React from 'react';
import type { Message } from '@/models/types';
import {
  isActivityMessage,
  isOutgoingMessage,
  isPrivateMessage,
  getMessageText,
} from '../utils/chatMessageUtils';
import { formatMessageTime } from '../utils/chatDateUtils';
import {
  ActivityMessage,
  ChatMessageBubbleProps,
  DateHeader,
  isArabicString,
  PrivateNote,
} from './ChatMessageBubbleCommon';
import { IncomingMessageBubble } from './IncomingMessageBubble';
import { OutgoingMessageBubble } from './OutgoingMessageBubble';

export type { ChatMessageBubbleProps };

export const ChatMessageBubble = React.memo((props: ChatMessageBubbleProps) => {
  const { message: m, isDark, isArabic, showDateHeader } = props;

  const isActivity = isActivityMessage(m);
  const isPrivate = isPrivateMessage(m);
  const isOutgoing = !isActivity && isOutgoingMessage(m);

  return (
    <>
      {showDateHeader && m.createdAt ? (
        <DateHeader date={m.createdAt} isDark={isDark} isArabic={isArabic} />
      ) : null}

      {isActivity ? (
        <ActivityMessage
          text={getMessageText(m)}
          time={formatMessageTime(m.createdAt)}
          isDark={isDark}
        />
      ) : isPrivate ? (
        <PrivateNote
          messageText={getMessageText(m)}
          time={formatMessageTime(m.createdAt)}
          isDark={isDark}
          isRTL={isArabicString(getMessageText(m))}
          senderName={props.contactName}
          attachments={m.attachments || []}
          onOpenFileViewer={props.onOpenFileViewer}
        />
      ) : isOutgoing ? (
        <OutgoingMessageBubble {...props} />
      ) : (
        <IncomingMessageBubble {...props} />
      )}
    </>
  );
});

export default ChatMessageBubble;

