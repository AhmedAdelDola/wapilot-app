import { MESSAGE_STATUS, MESSAGE_TYPES } from '@/constants';
import type { Message } from '@/models/types';
import { formatMessageDate } from './chatDateUtils';

export type DateSeparator = { date: string; type: 'date'; id: string };
export type ChatListItem = Message | DateSeparator;

const htmlToPlainText = (value: string): string => {
  if (!/[<>&]/.test(value)) return value;

  return value
    .replace(/<\s*(br|\/p|\/div|\/li|\/tr|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<\/(ul|ol|table)>/gi, '\n')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n')
    .trim();
};

export const getMessageText = (m: Message): string => {
  const raw = m as Message & Record<string, unknown>;
  const email = m.contentAttributes?.email;
  const rawEmail = (raw.content_attributes as { email?: { text_content?: unknown } } | undefined)?.email;
  const rawEmailText = rawEmail?.text_content;
  const content = (
    email?.textContent?.full ||
    (typeof rawEmailText === 'string' ? rawEmailText : (rawEmailText as { full?: string } | undefined)?.full) ||
    email?.htmlContent?.full ||
    m.content ||
    (raw.message as string) ||
    (raw.text as string) ||
    ''
  );
  return htmlToPlainText(content);
};

export const isActivityMessage = (m: Message): boolean => {
  const rawType: unknown = m.messageType ?? (m as Message & { message_type?: unknown }).message_type;
  return (
    rawType === MESSAGE_TYPES.ACTIVITY ||
    rawType === 2 ||
    rawType === '2' ||
    rawType === 'activity'
  );
};

export const isPrivateMessage = (m: Message): boolean => {
  const raw = m as Message & { is_private?: boolean };
  return m.private === true || raw.is_private === true;
};

export const isOutgoingMessage = (m: Message): boolean => {
  const rawType: unknown = m.messageType ?? (m as Message & { message_type?: unknown }).message_type;
  const senderType = m.sender?.type ?? (m as Message & { sender_type?: string }).senderType;
  return (
    rawType === MESSAGE_TYPES.OUTGOING ||
    rawType === 1 ||
    rawType === '1' ||
    rawType === 'outgoing' ||
    senderType === 'user'
  );
};

export const getSenderId = (m: Message): number | undefined => {
  return m.senderId ?? m.sender?.id;
};

export const shouldGroupWithNext = (index: number, list: ChatListItem[]): boolean => {
  if (index < 0 || index >= list.length - 1) return false;
  const current = list[index];
  const next = list[index + 1];
  if ('type' in current && current.type === 'date') return false;
  if ('type' in next && next.type === 'date') return false;
  const cur = current as Message;
  const nxt = next as Message;
  if (!cur.id || !nxt.id) return false;
  if (nxt.status === MESSAGE_STATUS.FAILED) return false;
  if (isActivityMessage(cur) || isActivityMessage(nxt)) return false;
  if (isPrivateMessage(cur) !== isPrivateMessage(nxt)) return false;
  if (getSenderId(cur) !== getSenderId(nxt)) return false;
  if (cur.messageType !== nxt.messageType) return false;
  return Math.floor(nxt.createdAt / 60) === Math.floor(cur.createdAt / 60);
};

export const buildChatListItems = (messages: Message[], isArabic = false): ChatListItem[] => {
  const items: ChatListItem[] = [];
  messages.forEach((msg, idx) => {
    const showDate = idx === 0 || !isSameDay(messages[idx - 1]?.createdAt, msg.createdAt);
    if (showDate) {
      items.push({
        type: 'date',
        date: formatMessageDate(msg.createdAt, isArabic),
        id: `date-${msg.id}-${msg.createdAt}`,
      });
    }
    items.push(msg);
  });
  return items;
};

const isSameDay = (time1?: number | string | null, time2?: number | string | null): boolean => {
  if (!time1 || !time2) return false;
  const d1 = new Date(typeof time1 === 'number' && time1 < 1e11 ? time1 * 1000 : Number(time1));
  const d2 = new Date(typeof time2 === 'number' && time2 < 1e11 ? time2 * 1000 : Number(time2));
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const prepareMessagesWithGrouping = (messages: Message[], isArabic = false) => {
  const listItems = buildChatListItems(messages, isArabic);
  return listItems.map((item, index) => {
    if ('type' in item && item.type === 'date') return item;
    const msg = item as Message;
    return {
      ...msg,
      groupWithNext: shouldGroupWithNext(index, listItems),
      groupWithPrevious: shouldGroupWithNext(index - 1, listItems),
    };
  });
};

export const formatMentionsForSend = (message: string, isPrivate: boolean): string => {
  if (!isPrivate) return message;
  const regex = /@\[([\w\s]+)\]\((\d+)\)/g;
  return message.replace(
    regex,
    '[@$1](mention://user/$2/' + encodeURIComponent('$1') + ')',
  );
};
