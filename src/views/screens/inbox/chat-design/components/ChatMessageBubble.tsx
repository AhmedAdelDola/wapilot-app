import React from 'react';
import { CleanMessageBubble, CleanMessageBubbleProps } from '@/views/screens/chat-screen/components/CleanMessageBubble';

export type ChatMessageBubbleProps = CleanMessageBubbleProps;

export const ChatMessageBubble = React.memo((props: ChatMessageBubbleProps) => {
  return <CleanMessageBubble {...props} />;
});

export default ChatMessageBubble;
