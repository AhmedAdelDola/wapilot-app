import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Linking,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Message, ImageMetadata } from '@/models/types';
import { MESSAGE_STATUS } from '@/constants';
import {
  getMessageText,
  isActivityMessage,
  isOutgoingMessage,
  isPrivateMessage,
} from '@/views/screens/inbox/chat-design/utils/chatMessageUtils';
import { formatMessageTime, formatMessageDate } from '@/views/screens/inbox/chat-design/utils/chatDateUtils';
import { showToast } from '@/utils/toastUtils';

// ── Icons ────────────────────────────────────────────────────────────

const LockIcon = ({ color = '#F59E0B', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FileIcon = ({ color = '#725AFF' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M13 2v7h7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── URL regex & RTL detection ────────────────────────────────────────

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const isArabicString = (text: string): boolean =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

// ── Props ────────────────────────────────────────────────────────────

export type CleanMessageBubbleProps = {
  message: Message;
  index: number;
  isDark: boolean;
  isArabic: boolean;
  contactName?: string;
  conversation?: any;
  messageMap?: Map<string | number, Message>;
  highlightedMessageId?: number | null;
  showDateHeader?: boolean;
  onLayout?: (id: number, y: number) => void;
  onScrollToMessage?: (id: number) => void;
  onSetQuotedMessage?: (msg: Message) => void;
  onOpenFileViewer?: (uri: string, name: string) => void;
  onRetryMessage?: (msg: Message) => void;
};

// ── Delivery Status Component ────────────────────────────────────────

const DeliveryStatus = ({
  status,
  isDark,
  onRetry,
}: {
  status: string;
  isDark: boolean;
  onRetry?: () => void;
}) => {
  if (status === MESSAGE_STATUS.PROGRESS) {
    return (
      <ActivityIndicator
        size="small"
        color="rgba(255,255,255,0.7)"
        style={{ transform: [{ scale: 0.6 }], marginLeft: 2 }}
      />
    );
  }

  if (status === MESSAGE_STATUS.FAILED) {
    return (
      <Pressable onPress={onRetry} hitSlop={6} style={{ marginLeft: 2 }}>
        <Text style={{ fontSize: 12, color: '#FCA5A5', fontWeight: '800' }}>!</Text>
      </Pressable>
    );
  }

  const isRead = status === MESSAGE_STATUS.READ;
  const isDelivered = status === MESSAGE_STATUS.DELIVERED;
  const isSent = status === MESSAGE_STATUS.SENT;

  if (isRead || isDelivered) {
    return (
      <Text
        style={{
          fontSize: 11,
          color: isRead ? '#38BDF8' : 'rgba(255,255,255,0.75)',
          fontWeight: '700',
          marginLeft: 2,
        }}>
        ✓✓
      </Text>
    );
  }

  if (isSent) {
    return (
      <Text
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.75)',
          fontWeight: '700',
          marginLeft: 2,
        }}>
        ✓
      </Text>
    );
  }

  return null;
};

// ── Message Text with Links Component ────────────────────────────────

const FormattedMessageText = ({
  text,
  color,
  linkColor,
}: {
  text: string;
  color: string;
  linkColor?: string;
}) => {
  const isRTL = isArabicString(text);

  const parts = useMemo(() => {
    const segments: { text: string; isLink: boolean; url?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    URL_REGEX.lastIndex = 0;
    while ((match = URL_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), isLink: false });
      }
      segments.push({ text: match[0], isLink: true, url: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isLink: false });
    }
    return segments;
  }, [text]);

  if (parts.length <= 1) {
    return (
      <Text
        style={{
          fontSize: 15,
          color,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}>
        {text}
      </Text>
    );
  }

  return (
    <Text
      style={{
        fontSize: 15,
        color,
        textAlign: isRTL ? 'right' : 'left',
        writingDirection: isRTL ? 'rtl' : 'ltr',
      }}>
      {parts.map((part, i) =>
        part.isLink ? (
          <Text
            key={i}
            style={{
              color: linkColor || '#725AFF',
              textDecorationLine: 'underline',
              fontWeight: '600',
            }}
            onPress={() => Linking.openURL(part.url!)}>
            {part.text}
          </Text>
        ) : (
          <Text key={i} style={{ color }}>
            {isRTL ? `\u200F${part.text}\u200F` : part.text}
          </Text>
        ),
      )}
    </Text>
  );
};

// ── Attachment Item ──────────────────────────────────────────────────

const AttachmentItem = ({
  attachment,
  isOutgoing,
  isDark,
  onOpen,
}: {
  attachment: ImageMetadata;
  isOutgoing: boolean;
  isDark: boolean;
  onOpen?: (uri: string, name: string) => void;
}) => {
  const uri = attachment.dataUrl || attachment.thumbUrl;
  if (!uri) return null;

  const fileType = String(attachment.fileType || '').toLowerCase();
  const fileName = attachment.fallbackTitle || 'Attachment';
  const isImage = fileType === 'image' || /\.(png|jpe?g|gif|webp|heic)(?:\?|$)/i.test(uri);

  if (isImage) {
    return (
      <Pressable
        onPress={() => onOpen?.(uri, fileName)}
        style={{ marginBottom: 6, borderRadius: 12, overflow: 'hidden' }}>
        <Image
          source={{ uri }}
          style={{ width: 220, height: 160, borderRadius: 12 }}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onOpen?.(uri, fileName)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 6,
        borderRadius: 10,
        backgroundColor: isOutgoing
          ? 'rgba(255,255,255,0.18)'
          : isDark
          ? '#24262B'
          : '#F1F5F9',
      }}>
      <FileIcon color={isOutgoing ? '#ffffff' : '#725AFF'} />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isOutgoing ? '#ffffff' : isDark ? '#EDEEF0' : '#101113',
          maxWidth: 180,
        }}>
        {fileName}
      </Text>
    </Pressable>
  );
};

// ── Clean Message Bubble Component ───────────────────────────────────

export const CleanMessageBubble = React.memo(
  ({
    message: m,
    index,
    isDark,
    isArabic,
    contactName,
    messageMap,
    highlightedMessageId,
    showDateHeader,
    onScrollToMessage,
    onSetQuotedMessage,
    onOpenFileViewer,
    onRetryMessage,
  }: CleanMessageBubbleProps) => {
    const isActivity = isActivityMessage(m);
    const isPrivate = isPrivateMessage(m);
    const isOutgoing = !isActivity && isOutgoingMessage(m);

    const messageText = getMessageText(m);
    const time = formatMessageTime(m.createdAt);

    // Reply Message
    const replyMessage = useMemo(() => {
      const replyId = m.contentAttributes?.inReplyTo;
      return replyId ? messageMap?.get(replyId) : undefined;
    }, [m.contentAttributes?.inReplyTo, messageMap]);

    // Long press handler: Quote & copy
    const handleLongPress = useCallback(() => {
      onSetQuotedMessage?.(m);
      if (messageText) {
        Clipboard.setString(messageText);
        showToast({ message: isArabic ? 'تم نسخ الرسالة وتحديدها للرد' : 'Copied & selected to reply' });
      }
    }, [isArabic, m, messageText, onSetQuotedMessage]);

    // Colors
    const outgoingBg = '#725AFF';
    const outgoingText = '#FFFFFF';
    const outgoingTime = 'rgba(255,255,255,0.75)';

    const incomingBg = isDark ? '#1E2024' : '#FFFFFF';
    const incomingText = isDark ? '#F1F5F9' : '#0F172A';
    const incomingTime = isDark ? '#94A3B8' : '#64748B';
    const incomingBorder = isDark ? '#2D3139' : '#E2E8F0';

    const isHighlighted = highlightedMessageId === m.id;

    return (
      <View style={{ width: '100%', marginVertical: 3 }}>
        {/* Date Separator */}
        {showDateHeader && (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View
              style={{
                backgroundColor: isDark ? '#1E2024' : '#E2E8F0',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 14,
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: isDark ? '#94A3B8' : '#475569',
                }}>
                {formatMessageDate(m.createdAt, isArabic)}
              </Text>
            </View>
          </View>
        )}

        {/* Activity Message */}
        {isActivity && (
          <View style={{ alignItems: 'center', marginVertical: 6, paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#94A3B8' : '#64748B',
                textAlign: 'center',
                lineHeight: 18,
              }}>
              {messageText} {time ? `· ${time}` : ''}
            </Text>
          </View>
        )}

        {/* Private Note */}
        {isPrivate && (
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingHorizontal: 12,
            }}>
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={{
                maxWidth: '80%',
                minWidth: 70,
                backgroundColor: isDark ? '#271904' : '#FFFBEB',
                borderWidth: 1,
                borderColor: '#F59E0B',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <LockIcon color="#F59E0B" size={12} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
                  {isArabic ? 'ملاحظة خاصة' : 'Private Note'}
                </Text>
              </View>

              {messageText ? (
                <FormattedMessageText
                  text={messageText}
                  color={isDark ? '#FDE68A' : '#78350F'}
                  linkColor="#F59E0B"
                />
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                <Text style={{ fontSize: 10.5, color: '#F59E0B' }}>{time}</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Standard Message (Incoming / Outgoing) */}
        {!isActivity && !isPrivate && (
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              gap: 6,
            }}>
            {/* Incoming Sender Avatar */}
            {!isOutgoing && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isDark ? '#2D3139' : '#E0E7FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#725AFF' }}>
                  {(contactName || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* Bubble Card */}
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={300}
              style={{
                maxWidth: '80%',
                minWidth: 70,
                backgroundColor: isOutgoing ? outgoingBg : incomingBg,
                borderWidth: isOutgoing ? 0 : 1,
                borderColor: incomingBorder,
                borderRadius: 16,
                borderBottomRightRadius: isOutgoing ? 4 : 16,
                borderBottomLeftRadius: isOutgoing ? 16 : 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderStyle: isHighlighted ? 'solid' : undefined,
                ...(isHighlighted
                  ? { borderWidth: 2, borderColor: '#38BDF8' }
                  : {}),
              }}>
              {/* Reply / Quote Header */}
              {replyMessage && (
                <Pressable
                  onPress={() => onScrollToMessage?.(replyMessage.id)}
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: isOutgoing ? 'rgba(255,255,255,0.6)' : '#725AFF',
                    paddingLeft: 8,
                    marginBottom: 6,
                  }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: isOutgoing ? '#FFFFFF' : '#725AFF',
                      marginBottom: 1,
                    }}>
                    {replyMessage.sender?.name || (isArabic ? 'رسالة سابقة' : 'Replied message')}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12,
                      color: isOutgoing ? 'rgba(255,255,255,0.75)' : isDark ? '#94A3B8' : '#64748B',
                    }}>
                    {getMessageText(replyMessage)}
                  </Text>
                </Pressable>
              )}

              {/* Attachments */}
              {m.attachments?.length > 0 &&
                m.attachments.map((att, aIdx) => (
                  <AttachmentItem
                    key={aIdx}
                    attachment={att}
                    isOutgoing={isOutgoing}
                    isDark={isDark}
                    onOpen={onOpenFileViewer}
                  />
                ))}

              {/* Message Text */}
              {messageText ? (
                <FormattedMessageText
                  text={messageText}
                  color={isOutgoing ? outgoingText : incomingText}
                  linkColor={isOutgoing ? '#FFFFFF' : '#725AFF'}
                />
              ) : null}

              {/* Time & Delivery Status Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  alignSelf: 'flex-end',
                  marginTop: 4,
                  gap: 3,
                }}>
                <Text
                  style={{
                    fontSize: 10.5,
                    color: isOutgoing ? outgoingTime : incomingTime,
                  }}>
                  {time}
                </Text>
                {isOutgoing && (
                  <DeliveryStatus
                    status={m.status}
                    isDark={isDark}
                    onRetry={() => onRetryMessage?.(m)}
                  />
                )}
              </View>
            </Pressable>
          </View>
        )}
      </View>
    );
  },
);

export default CleanMessageBubble;
