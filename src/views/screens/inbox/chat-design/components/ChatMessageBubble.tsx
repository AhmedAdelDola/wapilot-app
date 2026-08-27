import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { Message } from '@/models/types';
import { MESSAGE_TYPES } from '@/constants';
import { ChatDeliveryStatus } from './ChatDeliveryStatus';
import { ChatReplyPreview } from './ChatReplyPreview';
import { formatMessageDate, formatMessageTime } from '../utils/chatDateUtils';
import { getMessageText, isActivityMessage, isOutgoingMessage, isPrivateMessage } from '../utils/chatMessageUtils';
import { AudioStatus, pausePlayer, resumePlayer, startPlayer } from '@/views/screens/chat-screen/components/audio-recorder';
import type { PlayBackType } from 'react-native-audio-recorder-player';
import { AttachmentIcon, LockIcon } from '@/svg-icons';
import { showToast } from '@/utils/toastUtils';

// Simple Arabic text detection
const isArabicString = (text: string): boolean =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

export type ChatMessageBubbleProps = {
  message: Message;
  index: number;
  isDark: boolean;
  isArabic: boolean;
  contactName: string;
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

export const MessageAttachmentView = ({
  attachment,
  isDark,
  isOutgoing,
  onOpenFile,
}: {
  attachment: any;
  isDark: boolean;
  isOutgoing: boolean;
  onOpenFile: (uri: string, name: string) => void;
}) => {
  const uri =
    attachment.dataUrl ||
    attachment.fileUrl ||
    attachment.file_url ||
    attachment.thumbUrl ||
    attachment.thumb_url;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await pausePlayer();
        setIsPlaying(false);
        return;
      }

      if (duration > 0 && progress > 0) {
        await resumePlayer();
        setIsPlaying(true);
        return;
      }

      const playbackStatus = (event: { status?: AudioStatus; data?: PlayBackType }) => {
        if (event.status === AudioStatus.STOPPED) {
          setIsPlaying(false);
          setProgress(0);
          return;
        }
        const playback = event.data;
        if (!playback) return;
        setDuration(playback.duration);
        setProgress(playback.duration ? playback.currentPosition / playback.duration : 0);
        if (playback.duration > 0 && playback.currentPosition >= playback.duration) {
          setIsPlaying(false);
          setProgress(0);
        }
      };

      await startPlayer(uri, playbackStatus);
      setIsPlaying(true);
    } catch {
      showToast({ message: 'Unable to play this voice message' });
    }
  };

  if (!uri) return null;

  const fileType = String(
    attachment.fileType || attachment.file_type || attachment.contentType || '',
  ).toLowerCase();
  const fileName = attachment.fileName || attachment.file_name || attachment.name || 'Attachment';
  const isImage =
    fileType === 'image' ||
    fileType.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|heic)$/i.test(uri);
  const isAudio =
    fileType === 'audio' ||
    fileType.startsWith('audio/') ||
    /\.(aac|m4a|mp3|wav|ogg|webm)$/i.test(uri);

  if (isImage) {
    return (
      <Pressable onPress={() => onOpenFile(uri, fileName)}>
        <Image
          source={{ uri }}
          style={{ width: 220, height: 150, borderRadius: 10, marginBottom: 6 }}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => (isAudio ? togglePlayback() : onOpenFile(uri, fileName))}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minWidth: 200,
        maxWidth: 280,
        padding: 10,
        marginBottom: 6,
        borderRadius: 12,
        backgroundColor: isOutgoing
          ? 'rgba(255,255,255,0.18)'
          : isDark
          ? '#334155'
          : '#f1f5f9',
      }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAudio ? '#0d9488' : 'transparent',
        }}>
        {isAudio ? (
          <Text style={{ color: '#ffffff', fontSize: 15, marginLeft: isPlaying ? 0 : 2 }}>
            {isPlaying ? 'Ⅱ' : '▶'}
          </Text>
        ) : (
          <AttachmentIcon stroke={isOutgoing ? '#ffffff' : '#0d9488'} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        {isAudio ? (
          <>
            <View style={{ height: 20, justifyContent: 'center' }}>
              <View
                style={{
                  height: 4,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: isOutgoing ? 'rgba(255,255,255,0.35)' : '#cbd5e1',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                    borderRadius: 999,
                    backgroundColor: isOutgoing ? '#ffffff' : '#14b8a6',
                  }}
                />
              </View>
            </View>
            <Text
              style={{
                color: isOutgoing ? 'rgba(255,255,255,0.85)' : isDark ? '#cbd5e1' : '#64748b',
                fontSize: 10,
              }}>
              {duration > 0
                ? (() => {
                    const currentMins = Math.floor((progress * duration) / 60000);
                    const currentSecs = String(Math.floor(((progress * duration) / 1000) % 60)).padStart(2, '0');
                    const totalMins = Math.floor(duration / 60000);
                    const totalSecs = String(Math.floor((duration / 1000) % 60)).padStart(2, '0');
                    return `${currentMins}:${currentSecs} / ${totalMins}:${totalSecs}`;
                  })()
                : 'Voice message'}
            </Text>
          </>
        ) : (
          <Text
            style={{
              color: isOutgoing ? '#ffffff' : isDark ? '#f8fafc' : '#1f2937',
              fontSize: 13,
              fontWeight: '600',
            }}
            numberOfLines={2}>
            {fileName}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

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

    return (
      <View style={{ width: '100%' }}>
        {showDateHeader && (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View
              style={{
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isDark ? '#334155' : '#e2e8f0',
              }}>
              <Text
                style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: 11,
                  fontWeight: '600',
                }}>
                {formatMessageDate(m.createdAt, isArabic)}
              </Text>
            </View>
          </View>
        )}

        {isActivity && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 6,
              paddingHorizontal: 24,
            }}>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#94a3b8' : '#64748b',
                textAlign: 'center',
                lineHeight: 18,
              }}>
              {messageText}
              {time ? (
                <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#9ca3af' }}>
                  {' '}
                  · {time}
                </Text>
              ) : null}
            </Text>
          </View>
        )}

        {!isActivity && isPrivateMsg && (
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              marginTop: 6,
              marginBottom: 2,
              paddingHorizontal: 8,
            }}>
            <View
              style={{
                backgroundColor: isDark ? '#271904' : '#fffbeb',
                borderWidth: 1,
                borderColor: isDark ? '#78350f' : '#fef08a',
                borderLeftWidth: 3.5,
                borderLeftColor: '#f59e0b',
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
                maxWidth: '85%',
                minWidth: 80,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <LockIcon size={12} color={isDark ? '#fbbf24' : '#d97706'} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: isDark ? '#fbbf24' : '#d97706',
                      letterSpacing: 0.2,
                    }}>
                    Private Note {(m as any).sender?.name ? `· ${(m as any).sender.name}` : ''}
                  </Text>
                </View>
                {time ? (
                  <Text style={{ color: isDark ? '#a16207' : '#b45309', fontSize: 10 }}>
                    {time}
                  </Text>
                ) : null}
              </View>

              {(m as any).attachments?.length > 0 &&
                (m as any).attachments.map((att: any, aIdx: number) => (
                  <MessageAttachmentView
                    key={aIdx}
                    attachment={att}
                    isDark={isDark}
                    isOutgoing={true}
                    onOpenFile={onOpenFileViewer || (() => {})}
                  />
                ))}

              {messageText ? (
                <Text
                  style={{
                    color: isDark ? '#fef3c7' : '#78350f',
                    fontSize: 15,
                    lineHeight: 22,
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                  {messageText}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {!isActivity && !isPrivateMsg && (
          <View
            onLayout={
              onLayout
                ? ({ nativeEvent }) => onLayout(m.id, nativeEvent.layout.y)
                : undefined
            }
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 6,
              marginTop: 5,
              paddingHorizontal: 8,
            }}>
            {!isOutgoing && (
              <Pressable
                onPress={() => {
                  const uri =
                    (m as any).sender?.thumbnail ||
                    (m as any).sender?.avatar_url ||
                    conversation?.meta?.sender?.thumbnail;
                  if (uri && onOpenFileViewer) {
                    onOpenFileViewer(uri, (m as any).sender?.name || contactName);
                  }
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: isDark ? '#1e3a5f' : '#dbeafe',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                {(m as any).sender?.thumbnail || (m as any).sender?.avatar_url ? (
                  <Image
                    source={{
                      uri: (m as any).sender.thumbnail || (m as any).sender.avatar_url,
                    }}
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb' }}>
                    {contactName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              onLongPress={() => onSetQuotedMessage?.(m)}
              delayLongPress={300}
              style={{
                maxWidth: '85%',
                minWidth: 80,
                backgroundColor: isOutgoing
                  ? '#2563eb'
                  : isDark
                  ? '#1e293b'
                  : '#ffffff',
                borderWidth: isOutgoing ? 0 : 1,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderRadius: 16,
                borderBottomRightRadius: isOutgoing ? 4 : 16,
                borderBottomLeftRadius: isOutgoing ? 16 : 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}>
              {/* Quoted Message Preview if replying to another message */}
              {(() => {
                const replyId =
                  (m as any).contentAttributes?.inReplyTo ??
                  (m as any).content_attributes?.in_reply_to;
                const replyMessage = replyId ? messageMap?.get(replyId) : undefined;
                return replyMessage ? (
                  <ChatReplyPreview
                    replyMessage={replyMessage}
                    isOutgoing={isOutgoing}
                    isDark={isDark}
                    onPress={() => onScrollToMessage?.(replyMessage.id)}
                  />
                ) : null;
              })()}

              {/* Sender name on incoming messages in group / multi-agent chats */}
              {!isOutgoing && (m as any).sender?.name ? (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: isDark ? '#60a5fa' : '#2563eb',
                    marginBottom: 2,
                  }}>
                  {(m as any).sender.name}
                </Text>
              ) : null}

              {/* Attachments */}
              {(m as any).attachments?.length > 0 &&
                (m as any).attachments.map((att: any, aIdx: number) => (
                  <MessageAttachmentView
                    key={aIdx}
                    attachment={att}
                    isDark={isDark}
                    isOutgoing={isOutgoing}
                    onOpenFile={onOpenFileViewer || (() => {})}
                  />
                ))}

              {/* Text Message Content */}
              {messageText ? (
                <Text
                  style={{
                    color: isOutgoing ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a',
                    fontSize: 15,
                    lineHeight: 22,
                    textAlign: isRTL ? 'right' : 'left',
                  }}>
                  {messageText}
                </Text>
              ) : null}

              {/* Time & Delivery Status Checkmarks */}
              {time ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    alignSelf: 'flex-end',
                    marginTop: 2,
                    gap: 3,
                  }}>
                  <Text
                    style={{
                      color: isOutgoing ? 'rgba(255,255,255,0.75)' : '#9ca3af',
                      fontSize: 10.5,
                    }}>
                    {time}
                  </Text>
                  <ChatDeliveryStatus
                    message={m}
                    isOutgoing={isOutgoing}
                    isDark={isDark}
                    onRetry={() => onRetryMessage?.(m)}
                  />
                </View>
              ) : null}
            </Pressable>

            {isOutgoing && (m as any).sender ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: isDark ? '#14532d' : '#dcfce7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                {(m as any).sender.thumbnail || (m as any).sender.avatar_url ? (
                  <Image
                    source={{
                      uri: (m as any).sender.thumbnail || (m as any).sender.avatar_url,
                    }}
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isDark ? '#86efac' : '#15803d',
                    }}>
                    {((m as any).sender.name ||
                      (m as any).sender.available_name ||
                      'A')
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                )}
              </View>
            ) : null}

            {highlightedMessageId === m.id && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: -2,
                  borderWidth: 2,
                  borderColor: '#60a5fa',
                  borderRadius: 18,
                }}
              />
            )}
          </View>
        )}
      </View>
    );
  },
);
