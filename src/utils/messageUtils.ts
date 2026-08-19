import { MESSAGE_TYPES, MESSAGE_STATUS } from '@/constants';
import { SendMessagePayload } from '@/store/conversation/conversationTypes';
import type { PendingMessage, MessageBuilderPayload } from '@/store/conversation/conversationTypes';
import type { Conversation, Message } from '@/types';
import { formatDate } from './dateTimeUtils';

export const getLastMessage = (conversation: Conversation): Message | null => {
  if (!conversation) return null;
  if (conversation.lastNonActivityMessage) {
    return conversation.lastNonActivityMessage;
  }
  const messages = conversation.messages;
  if (messages && messages.length > 0) {
    return messages[messages.length - 1];
  }
  return null;
};

export const getGroupedMessages = (
  messages: Message[],
): { date: string; data: Message[] }[] => {
  if (!messages || messages.length === 0) return [];
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
  const groups: { date: string; data: Message[] }[] = [];
  sorted.forEach(message => {
    const dateLabel = formatDate(message.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.data.push(message);
    } else {
      groups.push({ date: dateLabel, data: [message] });
    }
  });
  return groups;
};

export const getUuid = () =>
  'xxxxxxxx4xxx'.replace(/[xy]/g, c => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const createPendingMessage = (data: SendMessagePayload): PendingMessage => {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const tempMessageId = getUuid();

  const { message, file } = data;
  const tempAttachments = [{ id: tempMessageId }];
  const pendingMessage = {
    ...data,
    content: message || null,
    id: tempMessageId,
    echoId: tempMessageId,
    status: MESSAGE_STATUS.PROGRESS,
    createdAt: timestamp,
    messageType: MESSAGE_TYPES.OUTGOING,
    attachments: file ? tempAttachments : null,
  };

  return pendingMessage;
};

export const buildCreatePayload = (data: PendingMessage): MessageBuilderPayload => {
  let payload;
  const {
    message,
    file,
    private: isPrivate,
    echoId,
    ccEmails,
    bccEmails,
    contentAttributes,
    templateParams,
    toEmails,
  } = data;
  if (file) {
    payload = new FormData();
    if (message) {
      payload.append('content', message);
    }
    payload.append('message_type', 'outgoing');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    payload.append('attachments[]', {
      uri: file.uri,
      name: file.fileName || 'attachment.jpg',
      type: file.type?.includes('/') ? file.type : 'image/jpeg',
    });
    payload.append('private', isPrivate.toString());
    payload.append('echo_id', echoId);
    payload.append('cc_emails', ccEmails || '');
    payload.append('bcc_emails', bccEmails || '');

    if (toEmails) {
      payload.append('to_emails', toEmails);
    }
    if (contentAttributes) {
      const { inReplyTo, ...rest } = contentAttributes;
      payload.append(
        'content_attributes',
        JSON.stringify({ ...rest, ...(inReplyTo ? { in_reply_to: inReplyTo } : {}) }),
      );
    }
  } else {
    const { inReplyTo, ...restAttributes } = contentAttributes || {};
    payload = {
      content: message,
      private: isPrivate,
      echo_id: echoId,
      content_attributes: {
        ...restAttributes,
        ...(inReplyTo ? { in_reply_to: inReplyTo } : {}),
      },
      cc_emails: ccEmails,
      bcc_emails: bccEmails,
      template_params: templateParams,
    };
  }
  return payload;
};
