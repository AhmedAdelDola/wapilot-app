import React, { useCallback, useMemo } from 'react';
import { Clipboard, Image, Linking, Pressable, Text, View } from 'react-native';
import type { Message, ImageMetadata } from '@/models/types';
import { ChatDeliveryStatus } from './ChatDeliveryStatus';
import { formatMessageDate } from '../utils/chatDateUtils';
import { AudioStatus, pausePlayer, resumePlayer, startPlayer } from '@/views/screens/chat-screen/components/audio-recorder';
import type { PlayBackType } from 'react-native-audio-recorder-player';
import { AttachmentIcon, LockIcon } from '@/svg-icons';
import { showToast } from '@/utils/toastUtils';

// ── Helpers ──────────────────────────────────────────────────────────

export const isArabicString = (text: string): boolean =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

export const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const getSenderName = (sender?: any): string => {
  if (!sender) return '';
  return sender.name || sender.availableName || sender.available_name || '';
};

export const getSenderThumbnail = (sender?: any): string | null => {
  if (!sender) return null;
  return sender.thumbnail || sender.avatar_url || null;
};

// ── Colors ───────────────────────────────────────────────────────────

export const C = {
  outgoing: {
    bg: '#725AFF',
    text: '#ffffff',
    time: 'rgba(255,255,255,0.75)',
    avatarBg: 'rgba(44,165,74,0.15)',
    avatarText: '#15803d',
  },
  incoming: {
    bgLight: '#ffffff',
    bgDark: '#1B1C20',
    textLight: '#101113',
    textDark: '#EDEEF0',
    border: '#EAEAEA',
    borderDark: '#24262B',
    time: '#80838D',
    avatarBg: '#dbeafe',
    avatarText: '#725AFF',
    avatarBgDark: '#1e3a5f',
  },
  private: {
    bgLight: '#fffbeb',
    bgDark: '#271904',
    borderLight: '#fef08a',
    borderDark: '#78350f',
    accent: '#FA8900',
    textLight: '#78350f',
    textDark: 'rgba(250,137,0,0.15)',
    labelLight: '#FA8900',
    labelDark: '#FA8900',
    timeLight: '#b45309',
    timeDark: '#FA8900',
  },
  date: {
    bgLight: '#F0F0F3',
    bgDark: '#1B1C20',
    borderLight: '#EAEAEA',
    borderDark: '#24262B',
    textLight: '#80838D',
    textDark: '#94a3b8',
  },
  activity: {
    textLight: '#80838D',
    textDark: '#94a3b8',
    timeLight: '#80838D',
    timeDark: '#80838D',
  },
  highlight: '#725AFF',
};

export const BUBBLE_COLORS = C;

// ── Props ────────────────────────────────────────────────────────────

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

export type IncomingMessageBubbleProps = {
  message: Message;
  index: number;
  isDark: boolean;
  isArabic: boolean;
  contactName: string;
  conversation?: any;
  messageMap?: Map<string | number, Message>;
  highlightedMessageId?: number | null;
  onLayout?: (id: number, y: number) => void;
  onScrollToMessage?: (id: number) => void;
  onSetQuotedMessage?: (msg: Message) => void;
  onOpenFileViewer?: (uri: string, name: string) => void;
};

export type OutgoingMessageBubbleProps = {
  message: Message;
  index: number;
  isDark: boolean;
  isArabic: boolean;
  contactName: string;
  conversation?: any;
  messageMap?: Map<string | number, Message>;
  highlightedMessageId?: number | null;
  onLayout?: (id: number, y: number) => void;
  onScrollToMessage?: (id: number) => void;
  onSetQuotedMessage?: (msg: Message) => void;
  onOpenFileViewer?: (uri: string, name: string) => void;
  onRetryMessage?: (msg: Message) => void;
};

// ── Date Header ──────────────────────────────────────────────────────

export const DateHeader = React.memo(({ date, isDark, isArabic }: { date: number; isDark: boolean; isArabic: boolean }) => (
  <View style={{ alignItems: 'center', marginVertical: 12 }} accessibilityRole="text">
    <View
      style={{
        backgroundColor: isDark ? C.date.bgDark : C.date.bgLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: isDark ? C.date.borderDark : C.date.borderLight,
      }}>
      <Text style={{ color: isDark ? C.date.textDark : C.date.textLight, fontSize: 11, fontWeight: '600' }}>
        {formatMessageDate(date, isArabic)}
      </Text>
    </View>
  </View>
));

// ── Activity Message ─────────────────────────────────────────────────

export const ActivityMessage = React.memo(
  ({ text, time, isDark }: { text: string; time: string; isDark: boolean }) => (
    <View
      style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 6, paddingHorizontal: 24 }}
      accessibilityRole="text"
      accessibilityLabel={`Activity: ${text}`}>
      <Text style={{ fontSize: 12, color: isDark ? C.activity.textDark : C.activity.textLight, textAlign: 'center', lineHeight: 18 }}>
        {text}
        {time ? (
          <Text style={{ fontSize: 11, color: isDark ? C.activity.timeDark : C.activity.timeLight }}>
            {' · '}{time}
          </Text>
        ) : null}
      </Text>
    </View>
  ),
);

// ── Private Note ─────────────────────────────────────────────────────

export const PrivateNote = React.memo(
  ({
    messageText,
    time,
    isDark,
    isRTL,
    senderName,
    attachments,
    onOpenFileViewer,
  }: {
    messageText: string;
    time: string;
    isDark: boolean;
    isRTL: boolean;
    senderName: string;
    attachments: ImageMetadata[];
    onOpenFileViewer?: (uri: string, name: string) => void;
  }) => (
    <View
      style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, marginBottom: 2, paddingHorizontal: 8 }}
      accessibilityRole="text"
      accessibilityLabel={`Private note from ${senderName}`}>
      <View
        style={{
          backgroundColor: isDark ? C.private.bgDark : C.private.bgLight,
          borderWidth: 1,
          borderColor: isDark ? C.private.borderDark : C.private.borderLight,
          borderLeftWidth: 3.5,
          borderLeftColor: C.private.accent,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 8,
          maxWidth: '85%',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <LockIcon size={12} color={isDark ? C.private.labelDark : C.private.labelLight} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? C.private.labelDark : C.private.labelLight, letterSpacing: 0.2 }}>
              Private Note{senderName ? ` · ${senderName}` : ''}
            </Text>
          </View>
          {time ? <Text style={{ color: isDark ? C.private.timeDark : C.private.timeLight, fontSize: 10 }}>{time}</Text> : null}
        </View>

        {attachments.length > 0 &&
          attachments.map((att, aIdx) => (
            <MessageAttachmentView key={aIdx} attachment={att} isDark={isDark} isOutgoing onOpenFile={onOpenFileViewer || (() => {})} />
          ))}

        {messageText ? (
          <View style={{ paddingVertical: 2, paddingHorizontal: 2 }}>
            <Text selectable style={{ color: isDark ? C.private.textDark : C.private.textLight, fontSize: 15, lineHeight: 22, textAlign: isRTL ? 'right' : 'left' }}>
              {messageText}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  ),
);

// ── Avatar ───────────────────────────────────────────────────────────

export const Avatar = React.memo(
  ({
    sender,
    isOutgoing,
    isDark,
    contactName,
    onPress,
  }: {
    sender?: any;
    isOutgoing: boolean;
    isDark: boolean;
    contactName: string;
    onPress?: () => void;
  }) => {
    const thumbnail = getSenderThumbnail(sender);
    const name = getSenderName(sender);
    const initial = (name || contactName || 'A').charAt(0).toUpperCase();

    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="image"
        accessibilityLabel={`Avatar of ${name || contactName}`}
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: isOutgoing
            ? isDark
              ? C.outgoing.avatarBg.replace('#dc', '#14')
              : C.outgoing.avatarBg
            : isDark
            ? C.incoming.avatarBgDark
            : C.incoming.avatarBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={{ width: 28, height: 28 }} />
        ) : (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: isOutgoing ? C.outgoing.avatarText : C.incoming.avatarText,
            }}>
            {initial}
          </Text>
        )}
      </Pressable>
    );
  },
);

// ── Time & Status ────────────────────────────────────────────────────

export const TimeAndStatus = React.memo(
  ({
    time,
    isOutgoing,
    isDark,
    message,
    onRetry,
  }: {
    time: string;
    isOutgoing: boolean;
    isDark: boolean;
    message: Message;
    onRetry?: () => void;
  }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', alignSelf: 'flex-end', marginTop: 6, gap: 3 }}>
      <Text style={{ color: isOutgoing ? C.outgoing.time : C.incoming.time, fontSize: 10.5 }}>{time}</Text>
      <ChatDeliveryStatus message={message} isOutgoing={isOutgoing} isDark={isDark} onRetry={onRetry || (() => {})} />
    </View>
  ),
);

// ── Linkified Text ───────────────────────────────────────────────────

export const LinkifiedText = React.memo(
  ({
    text,
    color,
    linkColor,
    fontSize,
    lineHeight,
    textAlign,
  }: {
    text: string;
    color: string;
    linkColor?: string;
    fontSize?: number;
    lineHeight?: number;
    textAlign?: 'left' | 'right' | 'center';
  }) => {
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

    const isRTL = isArabicString(text);
    const displayText = isRTL ? `\u200F${text}\u200F` : text;

    if (parts.length <= 1) {
      return (
        <Text
          style={{
            color,
            fontSize: fontSize || 15,
            lineHeight: lineHeight || 22,
            textAlign: textAlign || (isRTL ? 'right' : 'left'),
            writingDirection: isRTL ? 'rtl' : 'ltr',
            paddingHorizontal: 2,
          }}>
          {displayText}
        </Text>
      );
    }

    return (
      <Text
        style={{
          color,
          fontSize: fontSize || 15,
          lineHeight: lineHeight || 22,
          textAlign: textAlign || (isRTL ? 'right' : 'left'),
          writingDirection: isRTL ? 'rtl' : 'ltr',
          paddingHorizontal: 2,
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
            <Text key={i} style={{ color }}>{isRTL ? `\u200F${part.text}\u200F` : part.text}</Text>
          ),
        )}
      </Text>
    );
  },
);

// ── Message Attachment View ──────────────────────────────────────────

export const MessageAttachmentView = ({
  attachment,
  isDark,
  isOutgoing,
  onOpenFile,
}: {
  attachment: ImageMetadata;
  isDark: boolean;
  isOutgoing: boolean;
  onOpenFile: (uri: string, name: string) => void;
}) => {
  const uri = attachment.dataUrl || attachment.thumbUrl;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const togglePlayback = useCallback(async () => {
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
  }, [isPlaying, duration, progress, uri]);

  if (!uri) return null;

  const fileType = String(attachment.fileType || '').toLowerCase();
  const fileName = attachment.fallbackTitle || 'Attachment';
  const isImage = fileType === 'image' || /\.(png|jpe?g|gif|webp|heic)$/i.test(uri);
  const isAudio = fileType === 'audio' || /\.(aac|m4a|mp3|wav|ogg|webm)$/i.test(uri);

  if (isImage) {
    return (
      <Pressable onPress={() => onOpenFile(uri, fileName)} accessibilityRole="image" accessibilityLabel={fileName}>
        <Image source={{ uri }} style={{ width: 220, height: 150, borderRadius: 10, marginBottom: 6 }} resizeMode="cover" />
      </Pressable>
    );
  }

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = String(Math.floor((ms / 1000) % 60)).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <Pressable
      onPress={() => (isAudio ? togglePlayback() : onOpenFile(uri, fileName))}
      accessibilityRole="button"
      accessibilityLabel={isAudio ? (isPlaying ? 'Pause voice message' : 'Play voice message') : fileName}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minWidth: 200,
        maxWidth: 280,
        padding: 10,
        marginBottom: 6,
        borderRadius: 12,
        backgroundColor: isOutgoing ? 'rgba(255,255,255,0.18)' : isDark ? '#24262B' : '#F0F0F3',
      }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAudio ? '#725AFF' : 'transparent',
        }}>
        {isAudio ? (
          <Text style={{ color: '#ffffff', fontSize: 15, marginLeft: isPlaying ? 0 : 2 }}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
        ) : (
          <AttachmentIcon stroke={isOutgoing ? '#ffffff' : '#725AFF'} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        {isAudio ? (
          <>
            <View style={{ height: 20, justifyContent: 'center' }}>
              <View style={{ height: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: isOutgoing ? 'rgba(255,255,255,0.35)' : '#B0B4BA' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                    borderRadius: 999,
                    backgroundColor: isOutgoing ? '#ffffff' : '#725AFF',
                  }}
                />
              </View>
            </View>
            <Text style={{ color: isOutgoing ? 'rgba(255,255,255,0.85)' : isDark ? '#B0B4BA' : '#80838D', fontSize: 10 }}>
              {duration > 0 ? `${formatTime(progress * duration)} / ${formatTime(duration)}` : 'Voice message'}
            </Text>
          </>
        ) : (
          <Text style={{ color: isOutgoing ? '#ffffff' : isDark ? '#EDEEF0' : '#1B1C20', fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
            {fileName}
          </Text>
        )}
      </View>
    </Pressable>
  );
};
