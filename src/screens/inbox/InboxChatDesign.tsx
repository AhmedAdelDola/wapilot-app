import React, { useState, useMemo, useCallback } from 'react';
import {
  Pressable,
  Modal,
  StatusBar,
  Text,
  TextInput,
  View,
  ScrollView,
  FlatList,
  Animated,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { conversationActions } from '@/store/conversation/conversationActions';
import {
  selectAllConversations,
  selectConversationsLoading,
  selectConversationById,
  getMessagesByConversationId,
  selectIsAllMessagesFetched,
} from '@/store/conversation/conversationSelectors';
import { selectUserId } from '@/store/auth/authSelectors';
import { selectAllInboxes } from '@/store/inbox/inboxSelectors';
import { ConversationService } from '@/store/conversation/conversationService';
import {
  profileService,
  LifecycleStage,
  Label as ApiLabel,
  CannedResponse as ApiCannedResponse,
  Agent as ApiAgent,
  Inbox as ApiInbox,
} from '@/services/profileService';
import type { Conversation } from '@/types/Conversation';
import type { ConversationListResponse } from '@/store/conversation/conversationTypes';
import type { Message } from '@/types';
import { MESSAGE_TYPES } from '@/constants';
import { useTheme } from '@/theme';
import { useHaptic } from '@/utils';
import { showToast } from '@/utils/toastUtils';
import { selectLocale } from '@/store/settings/settingsSelectors';
import { selectTypingUsers, selectTypingUsersByConversationId } from '@/store/conversation/conversationTypingSlice';
import { getChannelIcon } from '@/utils/getChannelIcon';
import { conversationService } from '@/services/conversationService';
import { contactService } from '@/services/contactService';
import { transformConversation } from '@/utils/camelCaseKeys';
import { AttachmentIcon, VoiceNote } from '@/svg-icons';
import { WebView } from 'react-native-webview';
import { AudioStatus, startPlayer, pausePlayer, resumePlayer } from '@/screens/chat-screen/components/audio-recorder';
import type { PlayBackType } from 'react-native-audio-recorder-player';
import { ChatDeliveryStatus } from './chat-design/components/ChatDeliveryStatus';
import { ChatReplyPreview } from './chat-design/components/ChatReplyPreview';
import { ChatQuoteBar } from './chat-design/components/ChatQuoteBar';
import { ChatTypingBanner } from './chat-design/components/ChatTypingBanner';
import { ChatMentionSuggestions, extractMentionQuery, insertMention } from './chat-design/components/ChatMentionSuggestions';
import { ChatSearchSheet } from './chat-design/components/ChatSearchSheet';
import { useChatTyping } from './chat-design/hooks/useChatTyping';
import { getMessageText } from './chat-design/utils/chatMessageUtils';

// ---------- Date & Time Helpers ----------
const getConversationTimestamp = (item?: any): number => {
  if (!item) return 0;
  const candidates: number[] = [];
  const push = (v: any) => {
    const n = Number(v);
    if (!isNaN(n) && n > 0) candidates.push(n > 1e11 ? n : n * 1000);
  };
  push(item.lastActivityAt);
  push(item.last_activity_at);
  push(item.lastNonActivityMessage?.createdAt);
  push(item.last_non_activity_message?.created_at);
  push(item.updatedAt);
  push(item.updated_at);
  if (Array.isArray(item.messages) && item.messages.length > 0) {
    const lastMsg = item.messages[item.messages.length - 1];
    push(lastMsg?.createdAt);
    push(lastMsg?.created_at);
  }
  push(item.timestamp);
  push(item.createdAt);
  push(item.created_at);
  // Return the MOST RECENT timestamp available so a conversation always
  // lands in its correct position instead of falling to the bottom.
  return candidates.length > 0 ? Math.max(...candidates) : 0;
};

const parseDate = (rawTime?: number | string | null): Date | null => {
  if (!rawTime) return null;
  if (typeof rawTime === 'string') {
    const num = Number(rawTime);
    if (!isNaN(num) && num > 0) {
      return new Date(num > 1e11 ? num : num * 1000);
    }
    const d = new Date(rawTime);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof rawTime === 'number') {
    if (rawTime <= 0) return null;
    return new Date(rawTime > 1e11 ? rawTime : rawTime * 1000);
  }
  return null;
};

const formatChatTime = (rawTime?: number | string | null, isArabic = false): string => {
  if (!rawTime) return '';
  let timestamp: number;
  if (typeof rawTime === 'string') {
    const num = Number(rawTime);
    if (!isNaN(num) && num > 0) {
      timestamp = num > 1e11 ? num : num * 1000;
    } else {
      const d = new Date(rawTime);
      if (isNaN(d.getTime())) return '';
      timestamp = d.getTime();
    }
  } else if (typeof rawTime === 'number') {
    if (rawTime <= 0) return '';
    timestamp = rawTime > 1e11 ? rawTime : rawTime * 1000;
  } else {
    return '';
  }

  const date = new Date(timestamp);
  const now = new Date();

  // Reset hours to compare calendar days reliably
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const itemDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (itemDateStart === todayStart) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  if (itemDateStart === yesterdayStart) {
    return isArabic ? 'أمس' : 'Yesterday';
  }

  const diffDays = Math.round((todayStart - itemDateStart) / 86400000);
  if (diffDays < 7 && diffDays > 0) {
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return isArabic ? daysAr[date.getDay()] : daysEn[date.getDay()];
  }

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  if (date.getFullYear() === now.getFullYear()) {
    return isArabic
      ? `${date.getDate()} ${monthsAr[date.getMonth()]}`
      : `${monthsEn[date.getMonth()]} ${date.getDate()}`;
  }

  return isArabic
    ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const formatMessageTime = (rawTime?: number | string | null): string => {
  const date = parseDate(rawTime);
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatMessageDate = (rawTime?: number | string | null): string => {
  const date = parseDate(rawTime);
  if (!date) return '';
  const now = new Date();
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const isSameDay = (time1?: number | string | null, time2?: number | string | null): boolean => {
  const d1 = parseDate(time1);
  const d2 = parseDate(time2);
  if (!d1 || !d2) return false;
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

const getContactName = (sender?: any): string => {
  if (!sender) return 'Unknown';
  if (typeof sender.name === 'string' && sender.name.trim()) return sender.name.trim();
  if (typeof sender.available_name === 'string' && sender.available_name.trim()) return sender.available_name.trim();
  if (typeof sender.availableName === 'string' && sender.availableName.trim()) return sender.availableName.trim();
  if (sender.additional_attributes?.name && typeof sender.additional_attributes.name === 'string' && sender.additional_attributes.name.trim()) {
    return sender.additional_attributes.name.trim();
  }
  if (sender.additionalAttributes?.name && typeof sender.additionalAttributes.name === 'string' && sender.additionalAttributes.name.trim()) {
    return sender.additionalAttributes.name.trim();
  }
  if (sender.custom_attributes?.name && typeof sender.custom_attributes.name === 'string' && sender.custom_attributes.name.trim()) {
    return sender.custom_attributes.name.trim();
  }
  if (sender.customAttributes?.name && typeof sender.customAttributes.name === 'string' && sender.customAttributes.name.trim()) {
    return sender.customAttributes.name.trim();
  }
  if (typeof sender.phone_number === 'string' && sender.phone_number.trim()) return sender.phone_number.trim();
  if (typeof sender.phoneNumber === 'string' && sender.phoneNumber.trim()) return sender.phoneNumber.trim();
  if (typeof sender.email === 'string' && sender.email.trim()) return sender.email.trim();
  if (typeof sender.identifier === 'string' && sender.identifier.trim()) return sender.identifier.trim();
  return 'Unknown';
};

// ---------- Icons ----------
const HamburgerIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M3 12h18M3 18h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const SearchIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={2} />
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const UserCircleIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Circle cx={12} cy={10} r={3.2} stroke={color} strokeWidth={1.8} />
    <Path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const FilterIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M7 12h10M11 18h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const XIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const ChevronDown = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ArrowLeft = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChatBubbleIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PhoneIcon = ({ color = '#6b7280' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.62 10.79z" stroke={color} strokeWidth={1.8} />
  </Svg>
);
const ResolveIcon = ({ color = '#6b7280' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M7 12l3.5 3.5L17 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MoreIcon = ({ color = '#6b7280' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={5} cy={12} r={1.5} fill={color} />
    <Circle cx={12} cy={12} r={1.5} fill={color} />
    <Circle cx={19} cy={12} r={1.5} fill={color} />
  </Svg>
);
const SnoozeIcon = ({ color = '#6b7280' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={13} r={8} stroke={color} strokeWidth={1.8} />
    <Path d="M12 9v4l2.5 2.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M8 3l4 2 4-2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const WorkflowIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    <Path d="M14 17.5h7M17.5 14v7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const ShortcutIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BlockSlash = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const SendIcon = ({ color = '#3b82f6' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LockIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={2} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const ChatBlue = ({ color = '#3b82f6' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const StarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ShortcutBlue = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={18} height={18} rx={3} stroke="#3b82f6" strokeWidth={1.8} />
    <Path d="M7 8h10M7 12h8M7 16h6" stroke="#3b82f6" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const LifecycleIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const TeamIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={9} cy={7} r={4} stroke={color} strokeWidth={1.8} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const InboxDrawerIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} />
    <Path d="M3 12h4l2 3h6l2-3h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const MineIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={18} height={18} rx={4} stroke={color} strokeWidth={1.8} />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.5} />
    <Path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const UnassignedIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={8} r={3} stroke={color} strokeWidth={1.8} />
    <Path d="M3 20c0-3.3 2.7-6 6-6m6-1v6m-3-3h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

// ---------- FilterChip ----------
const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  const { isDark } = useTheme();
  return (
    <Pressable
      onPress={onClick}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active
          ? (isDark ? '#3b82f6' : '#111827')
          : (isDark ? '#1e293b' : '#f3f4f6'),
        borderWidth: 1,
        borderColor: active
          ? (isDark ? '#3b82f6' : '#111827')
          : (isDark ? '#334155' : '#e5e7eb'),
      }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: active ? '#ffffff' : (isDark ? '#cbd5e1' : '#374151'),
        }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ---------- Sheet wrapper (bottom) ----------
const BottomSheet = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  const { isDark } = useTheme();
  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={onClose}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: isDark ? '#1e293b' : 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
        <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#475569' : '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />
        {children}
      </View>
    </View>
  );
};

const MessageAttachment = ({ attachment, isDark, isOutgoing, onOpenFile }: { attachment: any; isDark: boolean; isOutgoing: boolean; onOpenFile: (uri: string, name: string) => void }) => {
  const uri = attachment.dataUrl || attachment.fileUrl || attachment.file_url || attachment.thumbUrl || attachment.thumb_url;
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
    } catch (error) {
      showToast({ message: 'Unable to play this voice message' });
      console.log('Voice playback error', error);
    }
  };

  if (!uri) return null;

  const fileType = String(attachment.fileType || attachment.file_type || attachment.contentType || '').toLowerCase();
  const fileName = attachment.fileName || attachment.file_name || attachment.name || 'Attachment';
  const isImage = fileType === 'image' || fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic)$/i.test(uri);
  const isAudio = fileType === 'audio' || fileType.startsWith('audio/') || /\.(aac|m4a|mp3|wav|ogg|webm)$/i.test(uri);

  if (isImage) {
    return (
      <Pressable onPress={() => onOpenFile(uri, fileName)}>
        <Image source={{ uri }} style={{ width: 180, height: 130, borderRadius: 8, marginBottom: 6 }} resizeMode="cover" />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => isAudio ? togglePlayback() : onOpenFile(uri, fileName)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 210, maxWidth: 280, padding: 12, marginBottom: 6, borderRadius: 14, backgroundColor: isOutgoing ? 'rgba(255,255,255,0.16)' : (isDark ? '#334155' : '#f1f5f9') }}>
      <View style={{ width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: isAudio ? '#0d9488' : 'transparent' }}>
        {isAudio ? <Text style={{ color: '#ffffff', fontSize: 15, marginLeft: isPlaying ? 0 : 2 }}>{isPlaying ? 'Ⅱ' : '▶'}</Text> : <AttachmentIcon stroke={isOutgoing ? '#ffffff' : '#0d9488'} />}
      </View>
      <View style={{ flex: 1 }}>
        {isAudio ? (
          <>
            <View style={{ height: 24, justifyContent: 'center' }}>
              <View style={{ height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: isOutgoing ? 'rgba(255,255,255,0.35)' : '#cbd5e1' }}>
                <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, progress * 100))}%`, borderRadius: 999, backgroundColor: isOutgoing ? '#ffffff' : '#14b8a6' }} />
              </View>
            </View>
            <Text style={{ color: isOutgoing ? 'rgba(255,255,255,0.8)' : (isDark ? '#cbd5e1' : '#64748b'), fontSize: 10 }}>
              {duration ? `${Math.floor((progress * duration) / 60000)}:${String(Math.floor((progress * duration) / 1000) % 60).padStart(2, '0')} / ${Math.floor(duration / 60000)}:${String(Math.floor(duration / 1000) % 60).padStart(2, '0')}` : 'Voice message'}
            </Text>
          </>
        ) : (
          <Text style={{ color: isOutgoing ? '#ffffff' : (isDark ? '#f8fafc' : '#1f2937'), fontSize: 13, fontWeight: '600' }} numberOfLines={2}>{fileName}</Text>
        )}
      </View>
    </Pressable>
  );
};

const ChatBubbleIcon2 = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------- Inbox Drawer ----------
const InboxDrawer = ({
  activeItem,
  onSelect,
  onClose,
}: {
  activeItem: string;
  onSelect: (key: string, label: string) => void;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectAllConversations);
  const userId = useAppSelector(selectUserId);
  const inboxes = useAppSelector(selectAllInboxes);

  const [lifecycleOpen, setLifecycleOpen] = useState(true);
  const [labelsOpen, setLabelsOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);
  const [custoOpen, setCustoOpen] = useState(true);
  const [apiLifecycleStages, setApiLifecycleStages] = useState<LifecycleStage[]>([]);
  const [apiLabels, setApiLabels] = useState<ApiLabel[]>([]);

  React.useEffect(() => {
    profileService
      .listLifecycleStages()
      .then(stages => {
        if (stages && Array.isArray(stages) && stages.length > 0) {
          setApiLifecycleStages(stages);
        }
      })
      .catch(() => {});

    profileService
      .listLabels()
      .then(labels => {
        if (labels && Array.isArray(labels) && labels.length > 0) {
          setApiLabels(labels);
        }
      })
      .catch(() => {});
  }, []);

  const conversationMeta = useAppSelector(state => state.conversations.meta);

  // Realtime counts derived from API meta response (fallback to local conversations if meta not available)
  const apiAllCount = conversationMeta?.allCount || conversations.length;
  const apiMineCount = conversationMeta?.mineCount ?? conversations.filter(c => c.meta?.assignee?.id === userId).length;
  const apiUnassignedCount = conversationMeta?.unassignedCount ?? conversations.filter(c => !c.meta?.assignee).length;

  const mainItems = [
    { key: 'all', label: 'All', icon: <InboxDrawerIcon />, count: apiAllCount },
    { key: 'mine', label: 'Mine', icon: <MineIcon />, count: apiMineCount },
    { key: 'unassigned', label: 'Unassigned', icon: <UnassignedIcon />, count: apiUnassignedCount },
  ];

const matchesStage = (c: any, stageName: string, stageId?: number): boolean => {
  if (!c) return false;
  const sLower = stageName.toLowerCase().trim();
  const sKey = sLower.replace(/\s+/g, '_');
  const sFirst = sLower.split(/\s+/)[0];

  if (Array.isArray(c.labels) && c.labels.length > 0) {
    const hasMatch = c.labels.some((l: any) => {
      if (typeof l !== 'string') return false;
      const ll = l.toLowerCase().trim();
      return (
        ll === sLower ||
        ll === sKey ||
        ll === sFirst ||
        ll.includes(sLower) ||
        sLower.includes(ll) ||
        (stageId && ll === String(stageId))
      );
    });
    if (hasMatch) return true;
  }

  const caStage =
    c.customAttributes?.lifecycle_stage ||
    c.customAttributes?.stage ||
    c.customAttributes?.lifecycleStage ||
    c.custom_attributes?.lifecycle_stage ||
    c.custom_attributes?.stage ||
    c.additionalAttributes?.lifecycle_stage;

  if (caStage) {
    const caStr = String(caStage).toLowerCase().trim();
    if (
      caStr === sLower ||
      caStr === sKey ||
      caStr === sFirst ||
      caStr.includes(sLower) ||
      sLower.includes(caStr) ||
      (stageId && caStr === String(stageId))
    ) {
      return true;
    }
  }

  const senderCa =
    c.meta?.sender?.customAttributes?.lifecycle_stage ||
    c.meta?.sender?.customAttributes?.stage ||
    c.meta?.sender?.custom_attributes?.lifecycle_stage ||
    c.meta?.sender?.additionalAttributes?.lifecycle_stage;

  if (senderCa) {
    const scaStr = String(senderCa).toLowerCase().trim();
    if (
      scaStr === sLower ||
      scaStr === sKey ||
      scaStr === sFirst ||
      scaStr.includes(sLower) ||
      sLower.includes(scaStr) ||
      (stageId && scaStr === String(stageId))
    ) {
      return true;
    }
  }

  return false;
};

  const lifecycle = (
    apiLifecycleStages.length > 0
      ? apiLifecycleStages
      : [
          { id: 1, name: 'New Lead', icon: '🆕' },
          { id: 2, name: 'Hot Lead', icon: '🔥' },
          { id: 3, name: 'Payment', icon: '💵' },
          { id: 4, name: 'Customer', icon: '😍' },
        ]
  ).map(st => {
    const sName = st.name;
    const sKey = `stage_${st.id || sName.toLowerCase()}`;
    const sCount = conversations.filter(c => matchesStage(c, sName, st.id)).length;
    return {
      key: sKey,
      label: sName,
      emoji: st.icon || '🌱',
      count: sCount,
      labelKey: sName.toLowerCase(),
    };
  });

  const { isDark } = useTheme();
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#374151';
  const dividerColor = isDark ? '#1e293b' : '#f3f4f6';
  const activeItemBg = isDark ? '#1e293b' : '#eff6ff';
  const activeItemText = isDark ? '#60a5fa' : '#2563eb';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: textPrimary }}>Inbox</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <UserCircleIcon color={isDark ? '#94a3b8' : '#374151'} />
          <FilterIcon color={isDark ? '#94a3b8' : '#374151'} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingBottom: 16 }}>
        {mainItems.map(({ key, label, icon, count }) => {
          const isActive = activeItem === key;
          return (
            <Pressable key={key} onPress={() => { onSelect(key, label); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: isActive ? 12 : 16, backgroundColor: isActive ? activeItemBg : 'transparent', marginHorizontal: isActive ? 12 : 0, borderRadius: isActive ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {icon}
                <Text style={{ fontWeight: '500', color: isActive ? activeItemText : textSecondary }}>{label}</Text>
              </View>
              <Text style={{ color: isActive ? activeItemText : '#9ca3af', fontSize: 14, fontWeight: '500' }}>{count}</Text>
            </Pressable>
          );
        })}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        {/* Lifecycle Stages */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setLifecycleOpen(!lifecycleOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LifecycleIcon color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={{ fontWeight: '600', color: textPrimary }}>Lifecycle Stages</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#374151'} />
        </Pressable>
        {lifecycleOpen && lifecycle.map(({ key, label, emoji, count }) => (
          <Pressable key={key} onPress={() => { onSelect(key, label); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{emoji}</Text>
              <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>{label}</Text>
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '500' }}>{count}</Text>
          </Pressable>
        ))}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        {/* Labels Section */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setLabelsOpen(!labelsOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={isDark ? '#34d399' : '#10b981'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Line x1={7} y1={7} x2={7.01} y2={7} stroke={isDark ? '#34d399' : '#10b981'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontWeight: '600', color: textPrimary }}>Labels</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#374151'} />
        </Pressable>
        {labelsOpen && (
          apiLabels && apiLabels.length > 0 ? (
            apiLabels.map(lbl => {
              const count = conversations.filter(c => Array.isArray(c.labels) && c.labels.some((l: any) => typeof l === 'string' && l.toLowerCase() === lbl.title.toLowerCase())).length;
              return (
                <Pressable
                  key={lbl.id}
                  onPress={() => {
                    onSelect(`label_${lbl.title}`, lbl.title);
                    onClose();
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: lbl.color || '#10b981' }} />
                    <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>
                      {lbl.title}
                    </Text>
                  </View>
                  <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '500' }}>{count}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No labels available</Text>
          )
        )}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        {/* Inboxes */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setCustoOpen(!custoOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <InboxDrawerIcon color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={{ fontWeight: '600', color: textPrimary }}>Inboxes</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#374151'} />
        </Pressable>
        {custoOpen && (
          inboxes && inboxes.length > 0 ? (
            inboxes.map(inbox => (
              <Pressable key={inbox.id} onPress={() => { onSelect(`inbox_${inbox.id}`, inbox.name); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ChatBubbleIcon2 />
                  <Text style={{ color: textSecondary, fontWeight: '500' }}>{inbox.name}</Text>
                </View>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>{conversations.filter(c => c.inboxId === inbox.id).length}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No inboxes available</Text>
          )
        )}
      </ScrollView>
    </View>
  );
};

// ---------- Chat Screen (ConversationDetailScreen) ----------
export const ChatScreenDesign = ({ conversationId, onBack }: { conversationId: number; onBack: () => void }) => {
  const dispatch = useAppDispatch();
  const { width: screenWidth } = useWindowDimensions();
  const stageSheetMaxHeight = Math.min(420, Math.max(260, screenWidth * 0.72));
  const scrollViewRef = React.useRef<ScrollView>(null);
  const messagePositionsRef = React.useRef<Record<number, number>>({});
  const initialScrolledRef = React.useRef(false);
  const isLoadingOlderRef = React.useRef(false);
  const prevScrollHeightRef = React.useRef(0);
  const currentScrollYRef = React.useRef(0);
  const shouldScrollToEndRef = React.useRef(false);
  const currentUserId = useAppSelector(selectUserId);
  const isAllMessagesFetched = useAppSelector(selectIsAllMessagesFetched(conversationId));
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const messages = useAppSelector(state => getMessagesByConversationId(state, { conversationId }));
  const [sheet, setSheet] = useState<null | 'menu' | 'search' | 'attachment' | 'assign' | 'stage' | 'snooze' | 'shortcut' | 'workflow' | 'labels'>(null);
  const [message, setMessage] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [shortcutSearch, setShortcutSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const firstLabel = conversation?.labels?.[0] || '';
  const [stage, setStage] = useState(
    firstLabel
      ? firstLabel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'New Lead',
  );
  const [stageEmoji, setStageEmoji] = useState('🌱');
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [fileViewer, setFileViewer] = useState<{ uri: string; name: string } | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const hapticTrigger = useHaptic('selection');
  const locale = useAppSelector(selectLocale);
  const isArabic = locale?.startsWith('ar') ?? false;
  const typingUsersSelector = useMemo(
    () => selectTypingUsersByConversationId(conversationId),
    [conversationId],
  );
  const typingUsers = useAppSelector(typingUsersSelector);
  const typingText = typingUsers.length
    ? isArabic
      ? `${typingUsers.map(user => user.name).filter(Boolean).join('، ')} يكتب الآن...`
      : `${typingUsers.map(user => user.name).filter(Boolean).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`
    : '';
  const { onTextChange: notifyTyping, onBlur: stopTyping } = useChatTyping(conversationId, isPrivate);

  const handleOpenAttachment = useCallback(async (uri: string, name: string) => {
    const isImage = /\.(png|jpe?g|gif|webp|heic)(?:\?|$)/i.test(uri);
    if (isImage) {
      setFileViewer({ uri, name });
      return;
    }
    try {
      if (await Linking.canOpenURL(uri)) {
        await Linking.openURL(uri);
        return;
      }
    } catch {
      // Fall back to the embedded viewer below.
    }
    setFileViewer({ uri, name });
  }, []);

  React.useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }

    const timer = setInterval(() => setRecordingSeconds(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const name = getContactName(conversation?.meta?.sender);
  const lastMsg = messages.length ? messages[messages.length - 1]?.content : (conversation && 'lastNonActivityMessage' in conversation ? conversation.lastNonActivityMessage?.content : '');

  const oldestMessageId = messages.length > 0 ? messages[0]?.id : null;

  const loadPreviousMessages = async () => {
    if (loadingOlder || isLoadingOlderRef.current || !oldestMessageId || isAllMessagesFetched) return;
    setLoadingOlder(true);
    isLoadingOlderRef.current = true;
    try {
      await dispatch(
        conversationActions.fetchPreviousMessages({
          conversationId,
          beforeId: oldestMessageId,
        } as any),
      ).unwrap();
    } catch (e) {
      console.log('Error loading previous messages:', e);
      isLoadingOlderRef.current = false;
    } finally {
      setLoadingOlder(false);
    }
  };

  React.useEffect(() => {
    dispatch(conversationActions.fetchConversation(conversationId));
    dispatch(conversationActions.fetchPreviousMessages({ conversationId, beforeId: null } as any));
    dispatch(conversationActions.markMessageRead({ conversationId }) as any);
  }, [conversationId]);

  const [apiStages, setApiStages] = useState<LifecycleStage[]>([]);
  const [apiLabels, setApiLabels] = useState<ApiLabel[]>([]);
  const [cannedResponses, setCannedResponses] = useState<ApiCannedResponse[]>([]);

  const shortcutMatch = message.match(/(?:^|\s)\/([^\s]*)$/);
  const shortcutQuery = shortcutMatch?.[1].toLowerCase() || '';
  const shortcutSuggestions = shortcutMatch
    ? cannedResponses
        .filter(response => {
          const code = (response.short_code || '').toLowerCase();
          return code.startsWith(shortcutQuery) || code.includes(shortcutQuery);
        })
        .slice(0, 5)
    : [];
  const [assignableAgents, setAssignableAgents] = useState<ApiAgent[]>([]);
  const mentionQuery = isPrivate ? extractMentionQuery(message) : null;

  const scrollToMessage = useCallback((messageId: number) => {
    setHighlightedMessageId(messageId);
    const y = messagePositionsRef.current[messageId];
    if (typeof y === 'number') scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  }, []);

  const sendCurrentMessage = useCallback(() => {
    const content = message.trim();
    if (!content) return;
    if (!isPrivate && conversation?.canReply === false) {
      showToast({ message: isArabic ? 'هذه القناة لا تسمح بالرد الآن' : 'This channel does not allow replies right now' });
      return;
    }
    shouldScrollToEndRef.current = true;
    dispatch(conversationActions.sendMessage({
      conversationId,
      message: content,
      private: isPrivate,
      contentAttributes: quotedMessage ? { inReplyTo: quotedMessage.id } : undefined,
    } as any));
    setMessage('');
    setQuotedMessage(null);
    stopTyping();
  }, [conversation?.canReply, conversationId, dispatch, isArabic, isPrivate, message, quotedMessage, stopTyping]);

  const handleToggleLabel = async (labelTitle: string) => {
    const currentLabels: string[] = Array.isArray(conversation?.labels) ? conversation.labels : [];
    const exists = currentLabels.some(l => (typeof l === 'string' ? l.toLowerCase() : '') === labelTitle.toLowerCase());
    const newLabels = exists
      ? currentLabels.filter(l => (typeof l === 'string' ? l.toLowerCase() : '') !== labelTitle.toLowerCase())
      : [...currentLabels, labelTitle];

    hapticTrigger?.();
    try {
      await ConversationService.addOrUpdateConversationLabels({
        conversationId,
        labels: newLabels,
      });
      showToast({ message: exists ? `Removed "${labelTitle}"` : `Added "${labelTitle}"` });
      dispatch(conversationActions.fetchConversation(conversationId));
    } catch (e) {
      console.log('Error updating conversation labels:', e);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentUserId) return;
    setSheet(null);
    hapticTrigger?.();
    try {
      await dispatch(
        conversationActions.assignConversation({
          conversationId,
          assigneeId: currentUserId,
        }),
      ).unwrap();
      showToast({ message: 'Assigned to you' });
      dispatch(conversationActions.fetchConversation(conversationId));
    } catch (e) {
      console.log('Error assigning conversation to me:', e);
    }
  };

  const handleUnassign = async () => {
    setSheet(null);
    hapticTrigger?.();
    try {
      await dispatch(
        conversationActions.assignConversation({
          conversationId,
          assigneeId: 0,
        }),
      ).unwrap();
      showToast({ message: 'Conversation unassigned' });
      dispatch(conversationActions.fetchConversation(conversationId));
    } catch (e) {
      console.log('Error unassigning conversation:', e);
    }
  };

  const handleAssignAgent = async (agentId: number, agentName: string) => {
    setSheet(null);
    hapticTrigger?.();
    try {
      await dispatch(
        conversationActions.assignConversation({
          conversationId,
          assigneeId: agentId,
        }),
      ).unwrap();
      showToast({ message: `Assigned to ${agentName}` });
      dispatch(conversationActions.fetchConversation(conversationId));
    } catch (e) {
      console.log('Error assigning agent:', e);
    }
  };

  React.useEffect(() => {
    profileService
      .listLifecycleStages()
      .then(stages => {
        if (stages && Array.isArray(stages) && stages.length > 0) {
          setApiStages(stages);
          // Sync current stage emoji with fetched stages
          if (firstLabel) {
            const fl = firstLabel.toLowerCase();
            const match = stages.find(s => {
              const sn = s.name.toLowerCase();
              return sn === fl || sn.replace(/\s+/g, '_') === fl || sn.split(/\s+/)[0] === fl;
            });
            if (match) {
              setStage(match.name);
              setStageEmoji(match.icon || '🌱');
            }
          }
        }
      })
      .catch(() => {});

    profileService
      .listLabels()
      .then(labels => {
        if (labels && Array.isArray(labels) && labels.length > 0) {
          setApiLabels(labels);
        }
      })
      .catch(() => {});

    profileService
      .listCannedResponses()
      .then(responses => {
        if (responses && Array.isArray(responses) && responses.length > 0) {
          setCannedResponses(responses);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (conversation?.inboxId) {
      profileService
        .listAssignableAgents(conversation.inboxId)
        .then(agents => {
          if (agents && Array.isArray(agents) && agents.length > 0) {
            setAssignableAgents(agents);
          }
        })
        .catch(() => {});
    }
  }, [conversation?.inboxId]);

  const handlePickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const fileObj = {
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name,
        };
        shouldScrollToEndRef.current = true;
        dispatch(
          conversationActions.sendMessage({
            conversationId,
            message: '',
            private: isPrivate,
            file: fileObj,
          } as any),
        );
      }
    } catch (e) {
      console.log('Attachment pick error', e);
    }
  };

  const sendMediaAssets = (assets: Array<{ uri: string; mimeType?: string | null; fileName?: string | null }>) => {
    if (!assets.length) return;
    shouldScrollToEndRef.current = true;
    assets.forEach((asset, index) => {
      dispatch(conversationActions.sendMessage({
        conversationId,
        message: '',
        private: isPrivate,
        file: {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `attachment-${Date.now()}-${index}.jpg`,
        },
      } as any));
    });
  };

  const handlePickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ message: isArabic ? 'يجب السماح بالوصول إلى الصور' : 'Photo library permission is required' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) sendMediaAssets(result.assets);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast({ message: isArabic ? 'يجب السماح بالوصول إلى الكاميرا' : 'Camera permission is required' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) sendMediaAssets(result.assets);
  };

  const finishVoiceRecording = async (send: boolean) => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingSeconds(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      if (send && uri) {
        shouldScrollToEndRef.current = true;
        dispatch(conversationActions.sendMessage({
          conversationId,
          message: '',
          private: isPrivate,
          file: { uri, type: 'audio/m4a', name: 'voice-message.m4a' },
        } as any));
      }
    } catch (e) {
      recordingRef.current = null;
      setIsRecording(false);
      showToast({ message: isArabic ? 'تعذر حفظ التسجيل الصوتي' : 'Unable to save voice recording' });
      console.log('Voice recording error', e);
    }
  };

  const handleVoicePress = async () => {
    try {
      if (recordingRef.current) {
        await finishVoiceRecording(true);
        return;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch (e) {
      recordingRef.current = null;
      setIsRecording(false);
      console.log('Voice recording error', e);
    }
  };

  const lifecycleStages =
    apiStages.length > 0
      ? apiStages.map(s => ({ emoji: s.icon || '🌱', label: s.name }))
      : [
          { emoji: '🆕', label: 'New Lead' },
          { emoji: '🔥', label: 'Hot Lead' },
          { emoji: '💵', label: 'Payment' },
          { emoji: '😍', label: 'Customer' },
        ];

  const lifecycleLabelKeys = new Set(
    [...lifecycleStages.map(item => item.label), 'Cold Lead'].map(item => item.toLowerCase().replace(/\s+/g, '_')),
  );

  const updateLifecycleStage = async (selectedStage?: { emoji: string; label: string }) => {
    const currentLabels = Array.isArray(conversation?.labels) ? conversation.labels : [];
    const labelsWithoutStage = currentLabels.filter(label => {
      const key = String(label).toLowerCase().replace(/\s+/g, '_');
      return !lifecycleLabelKeys.has(key);
    });
    const nextLabels = selectedStage
      ? [...labelsWithoutStage, selectedStage.label.toLowerCase().replace(/\s+/g, '_')]
      : labelsWithoutStage;

    try {
      await ConversationService.addOrUpdateConversationLabels({ conversationId, labels: nextLabels });
      if (selectedStage) {
        setStage(selectedStage.label);
        setStageEmoji(selectedStage.emoji);
      } else {
        setStage('New Lead');
        setStageEmoji('🌱');
      }
      dispatch(conversationActions.fetchConversation(conversationId));
    } catch {
      showToast({ message: isArabic ? 'تعذر تحديث المرحلة' : 'Unable to update lifecycle stage' });
    } finally {
      setSheet(null);
    }
  };

  const { isDark } = useTheme();
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#374151';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';
  const inputContainerBg = isDark ? '#1e293b' : '#fffbeb';
  const inputBorderColor = isDark ? '#334155' : '#fcd34d';
  const toolbarBorderColor = isDark ? '#334155' : '#fde68a';

  if (showContactDetails) {
    return <ContactDetailsScreen conversation={conversation as Conversation} onBack={() => setShowContactDetails(false)} />;
  }


  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar translucent backgroundColor={bgColor} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Header row 1 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: borderColor }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={onBack} hitSlop={8}><ArrowLeft color={textPrimary} /></Pressable>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => setShowContactDetails(true)}>
              {conversation?.meta?.sender?.thumbnail ? (
                <Image
                  source={{ uri: conversation.meta.sender.thumbnail }}
                  style={{ width: 36, height: 36, borderRadius: 999 }}
                />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: '#d97706', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={{ fontWeight: '600', color: textPrimary, fontSize: 16 }}>{name}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 }}>
              <PhoneIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
            </Pressable>
            <Pressable
              hitSlop={8}
              style={{
                padding: 6,
                backgroundColor: conversation?.status === 'resolved' ? (isDark ? '#064e3b' : '#dcfce7') : (isDark ? '#334155' : '#f3f4f6'),
                borderRadius: 999,
              }}
              onPress={async () => {
                const nextStatus = conversation?.status === 'resolved' ? 'open' : 'resolved';
                await ConversationService.toggleConversationStatus({
                  conversationId,
                  payload: { status: nextStatus },
                } as any);
                dispatch(conversationActions.fetchConversation(conversationId));
              }}>
              <ResolveIcon color={conversation?.status === 'resolved' ? '#22c55e' : (isDark ? '#94a3b8' : '#6b7280')} />
            </Pressable>
            <Pressable hitSlop={8} style={{ padding: 4 }} onPress={() => setSheet('menu')}><MoreIcon color={isDark ? '#94a3b8' : '#6b7280'} /></Pressable>
          </View>
        </View>

        {/* Header row 2 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderColor }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setSheet('assign')}>
            {conversation?.meta?.assignee?.thumbnail ? (
              <Image source={{ uri: conversation.meta.assignee.thumbnail }} style={{ width: 24, height: 24, borderRadius: 999 }} />
            ) : (
              <View style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                  {conversation?.meta?.assignee?.name ? conversation.meta.assignee.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 14, color: textSecondary, fontWeight: '500' }}>
              {conversation?.meta?.assignee?.name || 'Unassigned'}
            </Text>
            <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
          </Pressable>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: isDark ? '#334155' : '#d1d5db', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 'auto', maxWidth: '52%', flexShrink: 1 }} onPress={() => setSheet('stage')}>
            <Text style={{ fontSize: 14 }}>{stageEmoji}</Text>
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: textPrimary, flexShrink: 1 }}>{stage}</Text>
            <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
          </Pressable>

          <Pressable hitSlop={8} style={{ marginLeft: 4, padding: 4 }} onPress={() => setSheet('snooze')}><SnoozeIcon color={isDark ? '#94a3b8' : '#6b7280'} /></Pressable>
        </View>

        {/* Chat area */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingOlder}
              onRefresh={loadPreviousMessages}
              tintColor={isDark ? '#60a5fa' : '#2563eb'}
              colors={[isDark ? '#60a5fa' : '#2563eb']}
            />
          }
          onScroll={({ nativeEvent }) => {
            currentScrollYRef.current = nativeEvent.contentOffset.y;
            if (nativeEvent.contentOffset.y <= 25 && !loadingOlder && !isAllMessagesFetched) {
              loadPreviousMessages();
            }
          }}
          scrollEventThrottle={100}
          onContentSizeChange={(_w, newHeight) => {
            if (!initialScrolledRef.current && messages.length > 0) {
              initialScrolledRef.current = true;
              prevScrollHeightRef.current = newHeight;
              scrollViewRef.current?.scrollToEnd({ animated: false });
              return;
            }

            if (shouldScrollToEndRef.current) {
              shouldScrollToEndRef.current = false;
              prevScrollHeightRef.current = newHeight;
              scrollViewRef.current?.scrollToEnd({ animated: true });
              return;
            }

            if (isLoadingOlderRef.current) {
              const diff = newHeight - prevScrollHeightRef.current;
              if (diff > 0) {
                scrollViewRef.current?.scrollTo({
                  y: currentScrollYRef.current + diff,
                  animated: false,
                });
              }
              prevScrollHeightRef.current = newHeight;
              isLoadingOlderRef.current = false;
              return;
            }

            prevScrollHeightRef.current = newHeight;
          }}>

          {loadingOlder && (
            <View style={{ paddingVertical: 8, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>
          )}

          {/* Top Conversation Header */}
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16, paddingHorizontal: 20 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 1.5,
                borderColor: isDark ? '#334155' : '#e2e8f0',
              }}>
              {conversation?.meta?.sender?.thumbnail ? (
                <Image source={{ uri: conversation.meta.sender.thumbnail }} style={{ width: 48, height: 48, borderRadius: 999 }} />
              ) : (
                <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#60a5fa' : '#2563eb' }}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary, marginBottom: 2 }}>{name}</Text>
            <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              Conversation with <Text style={{ fontWeight: '600', color: textPrimary }}>{name}</Text>
            </Text>
          </View>

          {messages.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 13, color: isDark ? '#64748b' : '#9ca3af' }}>No messages yet</Text>
            </View>
          ) : null}

          {messages.map((m, idx) => {
            const rawType: any = m.messageType ?? (m as any).message_type;
            const isActivity = rawType === MESSAGE_TYPES.ACTIVITY || rawType === 2 || rawType === '2' || rawType === 'activity';
            const isPrivateMsg = (m as any).private === true || (m as any).is_private === true;
            const isOutgoing = !isActivity && (rawType === MESSAGE_TYPES.OUTGOING || rawType === 1 || rawType === '1' || rawType === 'outgoing' || (m as any).sender?.type === 'user');
            const time = formatMessageTime(m.createdAt);
            const msgTextColor = isDark ? '#f8fafc' : '#0f172a';

            const messageText = getMessageText(m);

            const showDateHeader = idx === 0 || !isSameDay(messages[idx - 1]?.createdAt, m.createdAt);

            return (
              <React.Fragment key={m.id ?? idx}>
                {showDateHeader && (
                  <View style={{ alignItems: 'center', marginVertical: 14 }}>
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
                        {formatMessageDate(m.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ─── 1. Activity / status-change message ─── */}
                {isActivity && (
                  <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8, paddingHorizontal: 28 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? '#94a3b8' : '#64748b',
                        textAlign: 'center',
                        lineHeight: 18,
                      }}>
                      {messageText}
                      {time ? (
                        <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#9ca3af' }}> · {time}</Text>
                      ) : null}
                    </Text>
                  </View>
                )}

                {/* ─── 2. Private note / comment ─── */}
                {!isActivity && isPrivateMsg && (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, marginBottom: 2 }}>
                    <View
                      style={{
                        backgroundColor: isDark ? '#271904' : '#fffbeb',
                        borderWidth: 1,
                        borderColor: isDark ? '#78350f' : '#fef08a',
                        borderLeftWidth: 3.5,
                        borderLeftColor: '#f59e0b',
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        maxWidth: '84%',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LockIcon size={12} color={isDark ? '#fbbf24' : '#d97706'} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#fbbf24' : '#d97706', letterSpacing: 0.2 }}>
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
                        (m as any).attachments.map((att: any, aIdx: number) => {
                          return <MessageAttachment key={aIdx} attachment={att} isDark={isDark} isOutgoing={true} onOpenFile={handleOpenAttachment} />;
                        })}
                      {messageText ? (
                        <Text
                          style={{
                            color: isDark ? '#fef3c7' : '#78350f',
                            fontSize: 14,
                            lineHeight: 20,
                          }}>
                          {messageText}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* ─── 3. Outgoing / Incoming message ─── */}
                {!isActivity && !isPrivateMsg && (
                  <View
                    onLayout={({ nativeEvent }) => {
                      messagePositionsRef.current[m.id] = nativeEvent.layout.y;
                    }}
                    style={{
                      flexDirection: 'row',
                      justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      gap: 8,
                      marginTop: 8,
                    }}>
                    {!isOutgoing && (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          overflow: 'hidden',
                          backgroundColor: isDark ? '#1e3a5f' : '#dbeafe',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {(m as any).sender?.thumbnail || (m as any).sender?.avatar_url ? (
                          <Image
                            source={{ uri: (m as any).sender.thumbnail || (m as any).sender.avatar_url }}
                            style={{ width: 28, height: 28 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb' }}>
                            {name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    )}
                    <Pressable
                      onLongPress={() => setQuotedMessage(m)}
                      delayLongPress={350}
                      style={{
                        backgroundColor: isOutgoing
                          ? (isDark ? '#2563eb' : '#2563eb')
                          : isDark
                          ? '#1e293b'
                          : '#ffffff',
                        borderWidth: isOutgoing ? 0 : 1,
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderRadius: 16,
                        borderBottomRightRadius: isOutgoing ? 4 : 16,
                        borderBottomLeftRadius: isOutgoing ? 16 : 4,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        maxWidth: '78%',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0.2 : 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}>
                      {(() => {
                        const replyId = (m as any).contentAttributes?.inReplyTo ?? (m as any).content_attributes?.in_reply_to;
                        const replyMessage = replyId ? messages.find(candidate => candidate.id === replyId) : undefined;
                        return replyMessage ? (
                          <ChatReplyPreview
                            replyMessage={replyMessage}
                            isOutgoing={isOutgoing}
                            isDark={isDark}
                            onPress={() => scrollToMessage(replyMessage.id)}
                          />
                        ) : null;
                      })()}
                      {!isOutgoing && (m as any).sender?.name ? (
                        <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#60a5fa' : '#2563eb', marginBottom: 2 }}>
                          {(m as any).sender.name}
                        </Text>
                      ) : null}
                      {(m as any).attachments?.length > 0 &&
                        (m as any).attachments.map((att: any, aIdx: number) => {
                          return <MessageAttachment key={aIdx} attachment={att} isDark={isDark} isOutgoing={isOutgoing} onOpenFile={handleOpenAttachment} />;
                        })}
                      {messageText ? (
                        <Text
                          style={{
                            color: isOutgoing ? '#ffffff' : msgTextColor,
                            fontSize: 14,
                            lineHeight: 20,
                            flexShrink: 1,
                            flexWrap: 'wrap',
                          }}>
                          {messageText}
                        </Text>
                      ) : null}
                      {time ? (
                        <View style={{ flexDirection: 'row', justifyContent: isOutgoing ? 'flex-end' : 'flex-start', alignItems: 'center', marginTop: 3 }}>
                          <Text style={{ color: isOutgoing ? 'rgba(255,255,255,0.75)' : '#9ca3af', fontSize: 10 }}>
                            {time}
                          </Text>
                          <ChatDeliveryStatus
                            message={m}
                            isOutgoing={isOutgoing}
                            isDark={isDark}
                            onRetry={() => {
                              if (!messageText) return showToast({ message: isArabic ? 'تعذر إعادة إرسال هذه الرسالة' : 'This message cannot be retried' });
                              dispatch(conversationActions.sendMessage({ conversationId, message: messageText, private: false } as any));
                            }}
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
                        }}>
                        {(m as any).sender.thumbnail || (m as any).sender.avatar_url ? (
                          <Image
                            source={{ uri: (m as any).sender.thumbnail || (m as any).sender.avatar_url }}
                            style={{ width: 28, height: 28 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#86efac' : '#15803d' }}>
                            {((m as any).sender.name || (m as any).sender.available_name || 'A').charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    ) : null}
                    {highlightedMessageId === m.id ? (
                      <View pointerEvents="none" style={{ position: 'absolute', inset: -2, borderWidth: 2, borderColor: '#60a5fa', borderRadius: 18 }} />
                    ) : null}
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>

        <ChatTypingBanner typingText={typingText} isDark={isDark} />

        {/* Input area */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: isPrivate
            ? (isDark ? '#92400e' : '#fde68a')
            : (isDark ? '#1e293b' : '#e5e7eb'),
          backgroundColor: isPrivate
            ? (isDark ? '#1c1400' : '#fffdf0')
            : inputContainerBg,
        }}>
          {!isPrivate && conversation?.canReply === false ? (
            <View style={{ marginHorizontal: 16, marginTop: 8, borderRadius: 8, backgroundColor: isDark ? '#451a03' : '#fff7ed', paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text style={{ color: isDark ? '#fed7aa' : '#9a3412', fontSize: 12, fontWeight: '600' }}>
                {isArabic ? 'لا يمكن الرد على هذه المحادثة حاليًا.' : 'Replies are currently unavailable for this conversation.'}
              </Text>
            </View>
          ) : null}
          {/* Private note banner */}
          {isPrivate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingTop: 8 }}>
              <LockIcon size={12} color={isDark ? '#fbbf24' : '#d97706'} />
              <Text style={{ color: isDark ? '#fbbf24' : '#d97706', fontSize: 12, fontWeight: '600' }}>
                Comments are only visible to your team
              </Text>
            </View>
          )}

          {quotedMessage ? (
            <ChatQuoteBar
              quoteMessage={quotedMessage}
              isDark={isDark}
              isArabic={isArabic}
              onClose={() => setQuotedMessage(null)}
              onPress={() => scrollToMessage(quotedMessage.id)}
            />
          ) : null}

          {isRecording ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: isDark ? '#3f1d24' : '#fff1f2', borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fecdd3' }}>
                <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 17 }}>●</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <Text style={{ color: isDark ? '#fecdd3' : '#9f1239', fontSize: 13, fontWeight: '700' }}>{isArabic ? 'جارٍ التسجيل' : 'Recording voice message'}</Text>
                    <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</Text>
                  </View>
                  <View style={{ height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: isDark ? '#7f1d1d' : '#fecdd3' }}>
                    <View style={{ width: `${18 + (recordingSeconds % 7) * 11}%`, height: '100%', borderRadius: 999, backgroundColor: '#ef4444' }} />
                  </View>
                </View>
                <Pressable onPress={() => finishVoiceRecording(false)} hitSlop={10} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
                  <Text style={{ color: isDark ? '#fecdd3' : '#9f1239', fontSize: 13, fontWeight: '700' }}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
                </Pressable>
                <Pressable onPress={() => finishVoiceRecording(true)} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 17, marginLeft: 2 }}>➤</Text>
                </Pressable>
              </View>
            </View>
          ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: isPrivate ? 6 : 10, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={message}
                onChangeText={value => {
                  setMessage(value);
                  notifyTyping();
                }}
                onBlur={stopTyping}
                multiline
                placeholder={isPrivate ? 'Add a private note...' : 'Type a message...'}
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                style={{ flex: 1, color: textPrimary, fontSize: 14, maxHeight: 100 }}
              />
              <Pressable
                hitSlop={8}
                onPress={sendCurrentMessage}>
                <SendIcon color={isPrivate ? (isDark ? '#fbbf24' : '#d97706') : '#3b82f6'} />
              </Pressable>
            </View>

            {mentionQuery !== null ? (
              <ChatMentionSuggestions
                agents={assignableAgents as any}
                query={mentionQuery}
                isDark={isDark}
                onSelect={agent => setMessage(current => insertMention(current, agent))}
              />
            ) : null}

            {!isPrivate && shortcutSuggestions.length > 0 && (
              <ScrollView
                style={{
                  marginTop: 8,
                  maxHeight: 220,
                  borderWidth: 1,
                  borderColor: isDark ? '#334155' : '#d1d5db',
                  borderRadius: 10,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  overflow: 'hidden',
                }}
                keyboardShouldPersistTaps="handled">
                {shortcutSuggestions.map(response => (
                  <Pressable
                    key={response.id}
                    onPress={() => {
                      hapticTrigger?.();
                      setMessage(currentMessage => currentMessage.replace(/\/[^\s]*$/, response.content));
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#334155' : '#f3f4f6',
                    }}>
                    <Text style={{ color: '#0d9488', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                      /{response.short_code}
                    </Text>
                    <Text style={{ color: textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                      {response.content}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
          )}

          {/* Toolbar */}
          {!isRecording ? <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingBottom: 12,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: isPrivate
              ? (isDark ? '#451a03' : '#fef3c7')
              : toolbarBorderColor,
          }}>
            {/* Toggle icon — switches between message & note */}
            <Pressable
              hitSlop={8}
              onPress={() => {
                hapticTrigger?.();
                setIsPrivate(prev => !prev);
              }}
              style={{
                padding: 3,
                borderRadius: 6,
                backgroundColor: isPrivate
                  ? (isDark ? '#451a03' : '#fef9c3')
                  : 'transparent',
              }}>
              {isPrivate
                ? <LockIcon size={20} color={isDark ? '#fbbf24' : '#d97706'} />
                : <ChatBlue color="#3b82f6" />
              }
            </Pressable>
            <View style={{ width: 1, height: 20, backgroundColor: isPrivate ? (isDark ? '#451a03' : '#fde68a') : toolbarBorderColor }} />
            <Pressable hitSlop={8} style={{ width: 24, height: 24 }} onPress={() => setSheet('attachment')}>
              <AttachmentIcon stroke={isPrivate ? (isDark ? '#a16207' : '#d97706') : '#2563eb'} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setSheet('shortcut')}>
              <ShortcutBlue />
            </Pressable>
            <Pressable hitSlop={8} style={{ width: 24, height: 24 }} onPress={handleVoicePress}>
              <VoiceNote stroke={isRecording ? '#ef4444' : (isDark ? '#94a3b8' : '#6b7280')} />
            </Pressable>
          </View> : null}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(fileViewer)} animationType="slide" onRequestClose={() => setFileViewer(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
          <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
            <Pressable onPress={() => setFileViewer(null)} hitSlop={8}>
              <Text style={{ color: '#0d9488', fontSize: 16, fontWeight: '700' }}>Close</Text>
            </Pressable>
            <Text style={{ flex: 1, marginHorizontal: 16, color: textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{fileViewer?.name}</Text>
            <View style={{ width: 42 }} />
          </View>
          {fileViewer ? (
            /\.(png|jpe?g|gif|webp|heic)(?:\?|$)/i.test(fileViewer.uri) ? (
              <Image source={{ uri: fileViewer.uri }} style={{ flex: 1 }} resizeMode="contain" />
            ) : (
              <WebView source={{ uri: fileViewer.uri }} style={{ flex: 1 }} startInLoadingState />
            )
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* ===== Modals ===== */}
      {sheet === 'menu' && (
        <BottomSheet onClose={() => setSheet(null)}>
          {[
            { icon: <SearchIcon color={textPrimary} />, label: isArabic ? 'بحث في المحادثة' : 'Search in chat', onPress: () => setSheet('search') },
            {
              icon: (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Line x1={7} y1={7} x2={7.01} y2={7} stroke={textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              ),
              label: 'Conversation Labels',
              onPress: () => setSheet('labels'),
            },
            { icon: <WorkflowIcon color={textPrimary} />, label: 'Ongoing Workflow', onPress: () => setSheet('workflow') },
            { icon: <ShortcutIcon color={textPrimary} />, label: 'Select Shortcut', onPress: () => setSheet('shortcut') },
            { icon: <BlockSlash color={textPrimary} />, label: 'Block Contact', onPress: () => setSheet(null) },
          ].map((item, i) => (
            <Pressable key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i === 4 ? 0 : 1, borderBottomColor: borderColor }} onPress={item.onPress}>
              <View>{item.icon}</View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: textPrimary }}>{item.label}</Text>
            </Pressable>
          ))}
        </BottomSheet>
      )}

      {sheet === 'search' ? (
        <ChatSearchSheet
          messages={messages}
          isDark={isDark}
          isArabic={isArabic}
          onClose={() => setSheet(null)}
          onSelectMessage={scrollToMessage}
        />
      ) : null}

      {sheet === 'attachment' ? (
        <BottomSheet onClose={() => setSheet(null)}>
          <Text style={{ color: textPrimary, fontSize: 17, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 14 }}>
            {isArabic ? 'إضافة مرفق' : 'Add attachment'}
          </Text>
          {[
            { label: isArabic ? 'ملف' : 'File', action: handlePickAttachment },
            { label: isArabic ? 'صور من المعرض' : 'Photos', action: handlePickMedia },
            { label: isArabic ? 'التقاط صورة' : 'Take photo', action: handleTakePhoto },
          ].map(item => (
            <Pressable
              key={item.label}
              onPress={() => {
                setSheet(null);
                item.action().catch(() => showToast({ message: isArabic ? 'تعذر إضافة المرفق' : 'Unable to add attachment' }));
              }}
              style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: borderColor }}>
              <Text style={{ color: textPrimary, fontSize: 16 }}>{item.label}</Text>
            </Pressable>
          ))}
        </BottomSheet>
      ) : null}

      {sheet === 'assign' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Assign User</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#6b7280'} />
            <TextInput
              value={assignSearch}
              onChangeText={setAssignSearch}
              placeholder="Search agents..."
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {assignSearch ? (
              <Pressable onPress={() => setAssignSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
            onPress={handleAssignToMe}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ position: 'relative', width: 36, height: 36, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Me</Text>
                <View style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 999, backgroundColor: '#22c55e', borderWidth: 2, borderColor: isDark ? '#1e293b' : '#fff' }} />
              </View>
              <Text style={{ color: textPrimary, fontWeight: '500' }}>Assign to me</Text>
            </View>
            {conversation?.meta?.assignee?.id === currentUserId && (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </Pressable>

          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
            onPress={handleUnassign}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: isDark ? '#334155' : '#f9a8d4', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={8} r={4} fill={isDark ? '#94a3b8' : '#db2777'} />
                  <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={isDark ? '#94a3b8' : '#db2777'} />
                </Svg>
              </View>
              <Text style={{ color: textPrimary, fontWeight: '500' }}>Unassign</Text>
            </View>
            {!conversation?.meta?.assignee && (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </Pressable>

          {assignableAgents && assignableAgents.length > 0 && (
            <ScrollView style={{ maxHeight: 220 }}>
              {assignableAgents
                .filter(ag => {
                  if (!assignSearch.trim()) return true;
                  const q = assignSearch.toLowerCase();
                  const aname = (ag.name || ag.available_name || '').toLowerCase();
                  return aname.includes(q);
                })
                .map(ag => (
                  <Pressable
                    key={ag.id}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: borderColor }}
                    onPress={() => handleAssignAgent(ag.id, ag.name || ag.available_name || 'Agent')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {ag.thumbnail ? (
                        <Image source={{ uri: ag.thumbnail }} style={{ width: 32, height: 32, borderRadius: 999 }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{ag.name ? ag.name.charAt(0).toUpperCase() : 'A'}</Text>
                        </View>
                      )}
                      <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>{ag.name || ag.available_name}</Text>
                    </View>
                    {conversation?.meta?.assignee?.id === ag.id && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
                    )}
                  </Pressable>
                ))}
            </ScrollView>
          )}
          <View style={{ height: 8 }} />
        </BottomSheet>
      )}

      {sheet === 'stage' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Select Stage</Text>
            <Pressable onPress={() => setSheet(null)}><Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
          </View>
          <Pressable style={{ width: '100%', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderColor }} onPress={() => updateLifecycleStage()}>
            <Text style={{ color: textSecondary, fontWeight: '500' }}>Clear Selection</Text>
          </Pressable>
          <Text style={{ paddingHorizontal: 20, color: '#14b8a6', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>Lifecycle Stages</Text>
          <ScrollView style={{ maxHeight: stageSheetMaxHeight }} contentContainerStyle={{ paddingBottom: 4 }}>
          {lifecycleStages.map(s => (
            <Pressable key={s.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }} onPress={() => updateLifecycleStage(s)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text style={{ color: textPrimary, fontWeight: '500' }}>{s.label}</Text>
              </View>
              {stage === s.label && <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
            </Pressable>
          ))}
          </ScrollView>
          <Text style={{ paddingHorizontal: 20, color: '#14b8a6', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>Lost Stages</Text>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }} onPress={() => updateLifecycleStage({ label: 'Cold Lead', emoji: '🧊' })}>
            <Text style={{ fontSize: 20 }}>🧊</Text>
            <Text style={{ color: textPrimary, fontWeight: '500' }}>Cold Lead</Text>
          </Pressable>
        </BottomSheet>
      )}

      {sheet === 'snooze' && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setSheet(null)}>
          <View style={{ backgroundColor: isDark ? '#1e293b' : 'white', borderRadius: 16, padding: 24, width: '100%', borderWidth: 1, borderColor: borderColor }} onStartShouldSetResponder={() => true}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: textPrimary, textAlign: 'center', marginBottom: 8 }}>Snooze Conversation</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary, textAlign: 'center', marginBottom: 12 }}>
              This action will snooze conversation with contact <Text style={{ fontWeight: 'bold', color: textPrimary }}>{name}.</Text>
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: textPrimary, textAlign: 'center', marginBottom: 16 }}>Snooze until:</Text>
            <View style={{ gap: 12 }}>
              {['PICK DATE & TIME', '30 MINUTES SAT, 03:32 PM', '1 HOURS SAT, 04:02 PM', '3 HOURS SAT, 06:02 PM', 'LATER TODAY SAT, 06:00 PM', 'LATER THIS WEEK MON, 08:00 AM', 'THIS WEEKEND SAT, 08:00 AM', 'NEXT WEEK SAT, 08:00 AM', 'CANCEL'].map((opt, i) => (
                <Pressable key={i} onPress={async () => {
                  if (opt !== 'CANCEL') {
                    await ConversationService.toggleConversationStatus({ conversationId, payload: { status: 'snoozed' } } as any);
                  }
                  setSheet(null);
                }}>
                  <Text style={{ color: '#0d9488', fontWeight: '600', textAlign: 'center', fontSize: 14 }}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {sheet === 'shortcut' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Select Shortcut</Text>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#6b7280'} />
            <TextInput
              value={shortcutSearch}
              onChangeText={setShortcutSearch}
              placeholder="Search shortcuts..."
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {shortcutSearch ? (
              <Pressable onPress={() => setShortcutSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView style={{ maxHeight: 280 }}>
            {(() => {
              const filtered = (cannedResponses || []).filter(cr => {
                if (!shortcutSearch.trim()) return true;
                const q = shortcutSearch.toLowerCase();
                return (
                  (cr.short_code || '').toLowerCase().includes(q) ||
                  (cr.content || '').toLowerCase().includes(q)
                );
              });

              if (filtered.length > 0) {
                return filtered.map(cr => (
                  <Pressable
                    key={cr.id}
                    style={{ width: '100%', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}
                    onPress={() => {
                      hapticTrigger?.();
                      setMessage(prev => {
                        if (!prev) return cr.content;
                        if (prev.endsWith('/')) return `${prev.slice(0, -1)}${cr.content}`;
                        return `${prev} ${cr.content}`;
                      });
                      setSheet(null);
                    }}>
                    <Text style={{ color: '#38bdf8', fontWeight: '600', fontSize: 13, marginBottom: 2 }}>/{cr.short_code}</Text>
                    <Text style={{ color: textPrimary, fontSize: 14 }} numberOfLines={2}>{cr.content}</Text>
                  </Pressable>
                ));
              }

              return (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                  <ShortcutIcon color={isDark ? '#94a3b8' : '#6b7280'} />
                  <Text style={{ color: '#9ca3af', fontWeight: '500' }}>
                    {shortcutSearch ? 'No matching shortcuts found' : 'No available shortcuts'}
                  </Text>
                </View>
              );
            })()}
          </ScrollView>
        </BottomSheet>
      )}

      {sheet === 'workflow' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Ongoing Workflow</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Circle cx={11} cy={11} r={8} stroke="#14b8a6" strokeWidth={2} /><Path d="m21 21-4.35-4.35" stroke="#14b8a6" strokeWidth={2} strokeLinecap="round" /></Svg>
            <Text style={{ color: '#14b8a6', fontSize: 14 }}>Search ongoing Workflows</Text>
          </View>
          <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32, paddingTop: 24, lineHeight: 22 }}>
            You can stop ongoing Workflows for this Contact here. Simply enable it in Workflow Settings and publish the Workflow on the web platform.
          </Text>
        </BottomSheet>
      )}

      {sheet === 'labels' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Conversation Labels</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#6b7280'} />
            <TextInput
              value={labelSearch}
              onChangeText={setLabelSearch}
              placeholder="Search labels..."
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {labelSearch ? (
              <Pressable onPress={() => setLabelSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView style={{ maxHeight: 280 }}>
            {(() => {
              const currentConvLabels = Array.isArray(conversation?.labels) ? conversation.labels : [];
              const filtered = (apiLabels || []).filter(lbl => {
                if (!labelSearch.trim()) return true;
                return (lbl.title || '').toLowerCase().includes(labelSearch.toLowerCase());
              });

              if (filtered.length > 0) {
                return filtered.map(lbl => {
                  const isSelected = currentConvLabels.some((l: any) => typeof l === 'string' && l.toLowerCase() === lbl.title.toLowerCase());
                  return (
                    <Pressable
                      key={lbl.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                      onPress={() => handleToggleLabel(lbl.title)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: lbl.color || '#3b82f6' }} />
                        <Text style={{ fontSize: 15, fontWeight: '500', color: textPrimary }}>{lbl.title}</Text>
                      </View>
                      {isSelected && (
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                });
              }

              return (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                  <Text style={{ color: '#9ca3af', fontWeight: '500' }}>
                    {labelSearch ? 'No matching labels' : 'No account labels found'}
                  </Text>
                </View>
              );
            })()}
          </ScrollView>
          <View style={{ height: 8 }} />
        </BottomSheet>
      )}
    </SafeAreaView>
  );
};

// ---------- Contact Details Screen ----------
const ContactDetailsScreen = ({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) => {
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = screenWidth < 360 ? 12 : 16;
  const stageSheetMaxHeight = Math.min(420, Math.max(260, screenWidth * 0.72));
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';
  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? '#334155' : '#e5e7eb';

  const contactId = conversation?.meta?.sender?.id;
  const sender = conversation?.meta?.sender;

  const initialFullName = sender?.name || '';
  const initialParts = initialFullName.trim().split(' ');
  const initialFirst = (sender as any)?.first_name || initialParts[0] || '';
  const initialLast = (sender as any)?.last_name || initialParts.slice(1).join(' ') || '';
  const initialEmail = sender?.email || '';
  const initialPhone = sender?.phoneNumber || (sender as any)?.phone_number || '';
  const initialCountry = (sender as any)?.additional_attributes?.country || (sender as any)?.country || 'Egypt';

  const [firstName, setFirstName] = React.useState(initialFirst);
  const [lastName, setLastName] = React.useState(initialLast);
  const [phone, setPhone] = React.useState(initialPhone);
  const [email, setEmail] = React.useState(initialEmail);
  const [country, setCountry] = React.useState(initialCountry);
  const [saving, setSaving] = React.useState(false);

  // Sheets & dynamic editing states
  const [sheet, setSheet] = React.useState<'assign' | 'stage' | 'labels' | null>(null);
  const [assignSearch, setAssignSearch] = React.useState('');
  const [labelSearch, setLabelSearch] = React.useState('');

  const [assignableAgents, setAssignableAgents] = React.useState<ApiAgent[]>([]);
  const [apiLabels, setApiLabels] = React.useState<ApiLabel[]>([]);
  const [apiLifecycleStages, setApiLifecycleStages] = React.useState<LifecycleStage[]>([]);

  const [selectedAssignee, setSelectedAssignee] = React.useState<{ id?: number; name?: string | null; thumbnail?: string | null } | null>(
    conversation?.meta?.assignee ? { id: conversation.meta.assignee.id, name: conversation.meta.assignee.name, thumbnail: (conversation.meta.assignee as any).thumbnail } : null
  );

  const initialTag = conversation?.labels?.[0];
  const initialStageEmoji = initialTag === 'new' ? '🌱' : initialTag === 'hot' ? '🔥' : initialTag === 'payment' ? '💵' : initialTag === 'customer' ? '😍' : initialTag === 'cold' ? '🧊' : '🌱';
  const initialStageName = initialTag === 'new' ? 'New Lead' : initialTag === 'hot' ? 'Hot Lead' : initialTag === 'payment' ? 'Payment' : initialTag === 'customer' ? 'Customer' : initialTag === 'cold' ? 'Cold Lead' : (initialTag ? initialTag.replace(/_/g, ' ') : 'New Lead');

  const [stageName, setStageName] = React.useState(initialStageName);
  const [stageEmoji, setStageEmoji] = React.useState(initialStageEmoji);
  const [lifecycleStageId, setLifecycleStageId] = React.useState<number | null>(null);
  const [currentLabels, setCurrentLabels] = React.useState<string[]>(
    Array.isArray(conversation?.labels) ? conversation.labels.filter(Boolean) : []
  );

  // Sync from API on mount
  React.useEffect(() => {
    if (!contactId) return;
    Promise.all([contactService.getContact(contactId), profileService.listLifecycleStages()])
      .then(([c, stages]) => {
        const fullName: string = c?.name || '';
        const parts = fullName.trim().split(' ');
        if (c?.first_name || parts[0]) setFirstName(c?.first_name || parts[0] || '');
        if (c?.last_name || parts.slice(1).join(' ')) setLastName(c?.last_name || parts.slice(1).join(' ') || '');
        if (c?.email) setEmail(c.email);
        if (c?.phone_number) setPhone(c.phone_number);
        if (c?.additional_attributes?.country) setCountry(c.additional_attributes.country);
        setApiLifecycleStages(stages || []);

        const rawStage = c?.lifecycle_stage_id ?? c?.custom_attributes?.lifecycle_stage_id ?? c?.custom_attributes?.lifecycle_stage;
        const selectedStage = stages.find(stage =>
          String(stage.id) === String(rawStage) || stage.name.toLowerCase() === String(rawStage || '').toLowerCase(),
        );
        if (selectedStage) {
          setLifecycleStageId(selectedStage.id);
          setStageName(selectedStage.name);
          setStageEmoji(selectedStage.icon || '🌱');
        }
      })
      .catch(() => {});

    profileService
      .listLabels()
      .then(lbls => {
        if (lbls && Array.isArray(lbls)) setApiLabels(lbls);
      })
      .catch(() => {});

    profileService
      .listAssignableAgents(conversation?.inboxId)
      .then(agents => {
        if (agents && Array.isArray(agents)) setAssignableAgents(agents);
      })
      .catch(() => {});
  }, [contactId, conversation?.inboxId]);

  const handleSave = async () => {
    if (!contactId) return;
    setSaving(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await contactService.updateContact(contactId, {
        name: fullName,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
        lifecycle_stage_id: lifecycleStageId,
      });
      showToast({ message: 'Contact updated successfully' });
      dispatch(conversationActions.fetchConversation(conversation.id));
      onBack();
    } catch (e) {
      showToast({ message: 'Failed to save contact' });
    } finally {
      setSaving(false);
    }
  };

  // Assignee actions
  const handleSelectAssignee = async (agent: ApiAgent) => {
    try {
      await ConversationService.assignConversation({
        conversationId: conversation.id,
        assigneeId: agent.id,
      });
      setSelectedAssignee({ id: agent.id, name: agent.name || agent.available_name, thumbnail: agent.thumbnail });
      dispatch(conversationActions.fetchConversation(conversation.id));
      showToast({ message: `Assigned to ${agent.name || agent.available_name}` });
    } catch {
      showToast({ message: 'Failed to assign agent' });
    } finally {
      setSheet(null);
    }
  };

  const handleUnassign = async () => {
    try {
      await ConversationService.assignConversation({
        conversationId: conversation.id,
        assigneeId: 0,
      });
      setSelectedAssignee(null);
      dispatch(conversationActions.fetchConversation(conversation.id));
      showToast({ message: 'Conversation unassigned' });
    } catch {
      showToast({ message: 'Failed to unassign' });
    } finally {
      setSheet(null);
    }
  };

  // Stage action
  const handleSelectStage = (stage: LifecycleStage) => {
    setLifecycleStageId(stage.id);
    setStageName(stage.name);
    setStageEmoji(stage.icon || '🌱');
    setSheet(null);
  };

  // Label toggle action
  const handleToggleLabel = async (labelTitle: string) => {
    try {
      const exists = currentLabels.some(l => l.toLowerCase() === labelTitle.toLowerCase());
      const nextLabels = exists
        ? currentLabels.filter(l => l.toLowerCase() !== labelTitle.toLowerCase())
        : [...currentLabels, labelTitle];

      setCurrentLabels(nextLabels);
      await ConversationService.addOrUpdateConversationLabels({
        conversationId: conversation.id,
        labels: nextLabels,
      });
      dispatch(conversationActions.fetchConversation(conversation.id));
    } catch {
      showToast({ message: 'Failed to update labels' });
    }
  };

  const inputCls = {
    width: '100%' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: inputBorder,
    backgroundColor: inputBg,
    borderRadius: 12,
    color: textPrimary,
    fontSize: 14,
    fontWeight: '500' as const,
  };
  const labelCls = { fontWeight: '600' as const, color: textPrimary, marginBottom: 6, fontSize: 14 };

  const defaultStages = [
    { emoji: '🌱', label: 'New Lead' },
    { emoji: '🔥', label: 'Hot Lead' },
    { emoji: '💵', label: 'Payment' },
    { emoji: '😍', label: 'Customer' },
    { emoji: '🧊', label: 'Cold Lead' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar translucent backgroundColor={bgColor} barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: horizontalPadding, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
        <Pressable onPress={onBack} hitSlop={8}><ArrowLeft color={textPrimary} /></Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: textPrimary }}>Contact Details</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
          {saving ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingTop: 20, paddingBottom: 48, gap: 18 }}
          showsVerticalScrollIndicator={false}>

          {/* First Name */}
          <View>
            <Text style={labelCls}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#9ca3af"
              style={inputCls}
            />
          </View>

          {/* Last Name */}
          <View>
            <Text style={labelCls}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#9ca3af"
              style={inputCls}
            />
          </View>

          {/* Language */}
          <View>
            <Text style={labelCls}>Language</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500' }}>Add Language</Text>
              <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
            </View>
          </View>

          {/* Phone */}
          <View>
            <Text style={labelCls}>Phone</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: inputBorder }}>
                <Text style={{ fontSize: 15 }}>🇪🇬</Text>
                <Text style={{ fontSize: 14, color: textSecondary, marginLeft: 2, fontWeight: '500' }}>+20</Text>
                <ChevronDown color={isDark ? '#94a3b8' : '#6b7280'} />
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: textPrimary, fontSize: 14, fontWeight: '500' }}
              />
            </View>
          </View>

          {/* Country */}
          <View>
            <Text style={labelCls}>Country</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15 }}>🇪🇬</Text>
                <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{country || 'Egypt'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <XIcon color={isDark ? '#94a3b8' : '#9ca3af'} />
                <ChevronDown color={isDark ? '#94a3b8' : '#9ca3af'} />
              </View>
            </View>
          </View>

          {/* Email */}
          <View>
            <Text style={labelCls}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Add Email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputCls}
            />
          </View>

          {/* Assignee (Interactive) */}
          <View>
            <Text style={labelCls}>Assignee</Text>
            <Pressable
              onPress={() => setSheet('assign')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ color: selectedAssignee?.name ? textPrimary : textSecondary, fontSize: 14, fontWeight: '500', flex: 1, paddingRight: 8 }} numberOfLines={1}>
                {selectedAssignee?.name || 'Unassigned'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {selectedAssignee?.name ? (
                  <Pressable hitSlop={8} onPress={(e) => { e.stopPropagation(); handleUnassign(); }}>
                    <XIcon color={isDark ? '#94a3b8' : '#9ca3af'} />
                  </Pressable>
                ) : null}
                <ChevronDown color={isDark ? '#94a3b8' : '#9ca3af'} />
              </View>
            </Pressable>
          </View>

          {/* Lifecycle Stage (Interactive) */}
          <View>
            <Text style={labelCls}>Lifecycle Stage</Text>
            <Pressable
              onPress={() => setSheet('stage')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 16 }}>{stageEmoji}</Text>
                <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{stageName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ChevronDown color={isDark ? '#94a3b8' : '#9ca3af'} />
              </View>
            </Pressable>
          </View>

          {/* Tags (Interactive) */}
          <View>
            <Text style={labelCls}>Tags</Text>
            <Pressable
              onPress={() => setSheet('labels')}
              style={{ borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: currentLabels.length > 0 ? 10 : 14, minHeight: 48, justifyContent: 'center' }}>
              {currentLabels.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1, paddingRight: 8 }}>
                    {currentLabels.map((lbl: string, idx: number) => {
                      const lblObj = apiLabels.find(al => (al.title || '').toLowerCase() === String(lbl).toLowerCase());
                      const badgeColor = lblObj?.color || '#3b82f6';
                      return (
                        <View
                          key={idx}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: badgeColor + (isDark ? '28' : '15'),
                            borderWidth: 1,
                            borderColor: badgeColor + (isDark ? '60' : '40'),
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                          }}>
                          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: badgeColor }} />
                          <Text style={{ color: isDark ? '#ffffff' : (badgeColor === '#ffffff' ? '#111827' : badgeColor), fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                            {lbl}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <ChevronDown color={isDark ? '#94a3b8' : '#9ca3af'} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500' }}>Add Tags</Text>
                  <ChevronDown color={isDark ? '#94a3b8' : '#9ca3af'} />
                </View>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Assignee BottomSheet ── */}
      {sheet === 'assign' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Assign Agent</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#6b7280'} />
            <TextInput
              value={assignSearch}
              onChangeText={setAssignSearch}
              placeholder="Search agent..."
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {assignSearch ? (
              <Pressable onPress={() => setAssignSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            ) : null}
          </View>

          {/* Unassign option */}
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}
            onPress={handleUnassign}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: isDark ? '#334155' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: textSecondary, fontWeight: '600', fontSize: 13 }}>✕</Text>
              </View>
              <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>Unassigned</Text>
            </View>
            {!selectedAssignee?.name && (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </Pressable>

          <ScrollView style={{ maxHeight: 260 }}>
            {assignableAgents
              .filter(ag => {
                if (!assignSearch.trim()) return true;
                const q = assignSearch.toLowerCase();
                const aname = (ag.name || ag.available_name || '').toLowerCase();
                return aname.includes(q);
              })
              .map(ag => {
                const isSelected = selectedAssignee?.id === ag.id;
                return (
                  <Pressable
                    key={ag.id}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}
                    onPress={() => handleSelectAssignee(ag)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {ag.thumbnail ? (
                        <Image source={{ uri: ag.thumbnail }} style={{ width: 32, height: 32, borderRadius: 999 }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{(ag.name || 'A').charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>{ag.name || ag.available_name}</Text>
                    </View>
                    {isSelected && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </Pressable>
                );
              })}
          </ScrollView>
          <View style={{ height: 10 }} />
        </BottomSheet>
      )}

      {/* ── Lifecycle Stage BottomSheet ── */}
      {sheet === 'stage' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Select Stage</Text>
            <Pressable onPress={() => setSheet(null)}><Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
          </View>

          <ScrollView style={{ maxHeight: stageSheetMaxHeight }} contentContainerStyle={{ paddingBottom: 4 }}>
            {(apiLifecycleStages.length > 0 ? apiLifecycleStages : defaultStages.map((stage, index) => ({
              id: index,
              name: stage.label,
              icon: stage.emoji,
            }))).map(s => {
              const isSelected = lifecycleStageId === s.id || stageName === s.name;
              return (
                <Pressable
                  key={s.id}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}
                  onPress={() => handleSelectStage(s)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 20 }}>{s.icon || '🌱'}</Text>
                    <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 15 }}>{s.name}</Text>
                  </View>
                  {isSelected && (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ height: 10 }} />
        </BottomSheet>
      )}

      {/* ── Tags / Labels BottomSheet ── */}
      {sheet === 'labels' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Conversation Tags</Text>
            <Pressable onPress={() => setSheet(null)}><Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
          </View>

          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#6b7280'} />
            <TextInput
              value={labelSearch}
              onChangeText={setLabelSearch}
              placeholder="Search tags..."
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {labelSearch ? (
              <Pressable onPress={() => setLabelSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView style={{ maxHeight: 280 }}>
            {(() => {
              const filtered = (apiLabels || []).filter(lbl => {
                if (!labelSearch.trim()) return true;
                return (lbl.title || '').toLowerCase().includes(labelSearch.toLowerCase());
              });

              if (filtered.length > 0) {
                return filtered.map(lbl => {
                  const isSelected = currentLabels.some(l => l.toLowerCase() === lbl.title.toLowerCase());
                  return (
                    <Pressable
                      key={lbl.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                      onPress={() => handleToggleLabel(lbl.title)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: lbl.color || '#3b82f6' }} />
                        <Text style={{ fontSize: 15, fontWeight: '500', color: textPrimary }}>{lbl.title}</Text>
                      </View>
                      {isSelected && (
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                });
              }

              return (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                  <Text style={{ color: '#9ca3af', fontWeight: '500' }}>
                    {labelSearch ? 'No matching tags found' : 'No account tags found'}
                  </Text>
                </View>
              );
            })()}
          </ScrollView>
          <View style={{ height: 10 }} />
        </BottomSheet>
      )}
    </SafeAreaView>
  );
};


// ---------- Inbox Screen ----------
const InboxScreenDesign = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const userId = useAppSelector(selectUserId);
  const allConversations = useAppSelector(selectAllConversations);
  const conversationsLoading = useAppSelector(selectConversationsLoading);
  const locale = useAppSelector(selectLocale);
  const isArabic = locale?.startsWith('ar');
  const typingRecords = useAppSelector(selectTypingUsers);
  const inboxes = useAppSelector(selectAllInboxes);
  const inboxesMap = useMemo(() => Object.fromEntries((inboxes || []).map(i => [i.id, i])), [inboxes]);

  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('mine');
  const [activeLabel, setActiveLabel] = useState('Mine');
  const [tab, setTab] = useState<'all' | 'open' | 'closed' | 'snoozed'>('open');
  const [showSort, setShowSort] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const pageRef = React.useRef(1);
  const hasMoreRef = React.useRef(true);
  const isFetchingMoreRef = React.useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [apiLifecycleStages, setApiLifecycleStages] = useState<LifecycleStage[]>([]);
  const [apiLabels, setApiLabels] = useState<ApiLabel[]>([]);

  React.useEffect(() => {
    profileService
      .listLifecycleStages()
      .then(stages => {
        if (stages && Array.isArray(stages)) setApiLifecycleStages(stages);
      })
      .catch(() => {});

    profileService
      .listLabels()
      .then(lbls => {
        if (lbls && Array.isArray(lbls)) setApiLabels(lbls);
      })
      .catch(() => {});
  }, []);

  // Server-side search state
  const [searchQuery, setSearchQuery] = useState('');
  const [serverSearchResults, setServerSearchResults] = useState<Conversation[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const fetchConversationsFromApi = React.useCallback(
    async (pageNumber = 1) => {
      let assigneeType: 'all' | 'me' | 'unassigned' = 'all';
      let targetInboxId = 0;

      if (activeItem === 'mine') assigneeType = 'me';
      if (activeItem === 'unassigned') assigneeType = 'unassigned';
      if (activeItem.startsWith('inbox_')) {
        targetInboxId = Number(activeItem.replace('inbox_', ''));
      }

      const apiStatus = tab === 'all' ? 'all' : tab === 'closed' ? 'resolved' : tab;

      if (pageNumber === 1) {
        dispatch(
          conversationActions.fetchConversationsMeta({
            status: apiStatus,
            assigneeType,
            inboxId: targetInboxId,
          } as any),
        );
      }

      const result = await dispatch(
        conversationActions.fetchConversations({
          status: apiStatus,
          assigneeType,
          inboxId: targetInboxId,
          page: pageNumber,
          sortBy: 'latest',
        } as any),
      );

      return (result as any).payload as ConversationListResponse;
    },
    [dispatch, tab, activeItem],
  );

  React.useEffect(() => {
    pageRef.current = 1;
    setPage(1);
    hasMoreRef.current = true;
    isFetchingMoreRef.current = false;
    fetchConversationsFromApi(1).then(data => {
      if (data && data.conversations && Array.isArray(data.conversations)) {
        if (data.conversations.length === 0) {
          hasMoreRef.current = false;
        }
      }
    });
  }, [fetchConversationsFromApi]);

  // Debounced server search
  React.useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setServerSearchResults([]);
      setIsSearchingServer(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingServer(true);
      try {
        const res = await conversationService.searchConversations(searchQuery.trim());
        if (res && Array.isArray(res.payload)) {
          setServerSearchResults(res.payload.map(transformConversation));
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingServer(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    pageRef.current = 1;
    setPage(1);
    hasMoreRef.current = true;
    isFetchingMoreRef.current = false;
    fetchConversationsFromApi(1).finally(() => {
      setRefreshing(false);
    });
  };

  const handleLoadMore = React.useCallback(async () => {
    if (isFetchingMoreRef.current || !hasMoreRef.current) return;
    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const data = await fetchConversationsFromApi(nextPage);
      if (data && data.conversations && Array.isArray(data.conversations)) {
        if (data.conversations.length > 0) {
          pageRef.current = nextPage;
          setPage(nextPage);
        }
        if (data.conversations.length === 0) {
          hasMoreRef.current = false;
        }
      } else {
        hasMoreRef.current = false;
      }
    } catch {
      // ignore
    } finally {
      isFetchingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [fetchConversationsFromApi]);

  const conversations = useMemo(() => {
    const list = allConversations.filter(item => {
      if (tab === 'open' && item.status !== 'open') return false;
      if (tab === 'closed' && item.status !== 'resolved') return false;
      if (tab === 'snoozed' && item.status !== 'snoozed') return false;

      if (activeItem === 'mine') {
        const assigneeId = item.meta?.assignee?.id ?? (item.meta?.assignee as any)?.user_id;
        return Number(assigneeId) === Number(userId);
      }
      if (activeItem === 'unassigned') {
        return !item.meta?.assignee;
      }
      if (activeItem.startsWith('inbox_')) {
        const targetId = Number(activeItem.replace('inbox_', ''));
        return item.inboxId === targetId || (item as any).inbox_id === targetId;
      }
      if (activeItem.startsWith('label_')) {
        const targetLabel = activeItem.replace('label_', '').toLowerCase();
        return Array.isArray(item.labels) && item.labels.some((l: any) => typeof l === 'string' && l.toLowerCase() === targetLabel);
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const aTime = Number(getConversationTimestamp(a)) || 0;
      const bTime = Number(getConversationTimestamp(b)) || 0;
      return sortBy === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [allConversations, tab, activeItem, userId, sortBy]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations.slice();
    const q = searchQuery.toLowerCase().trim();
    const localFiltered = conversations.filter(item => {
      const cname = getContactName(item.meta?.sender).toLowerCase();
      const email = (item.meta?.sender?.email || '').toLowerCase();
      const phone = (item.meta?.sender?.phoneNumber || (item.meta?.sender as any)?.phone_number || '').toLowerCase();
      const lastMsg = (item.lastNonActivityMessage?.content || item.messages?.[item.messages.length - 1]?.content || '').toLowerCase();
      return cname.includes(q) || email.includes(q) || phone.includes(q) || lastMsg.includes(q);
    });

    const localIds = new Set(localFiltered.map(c => c.id));
    const uniqueServer = serverSearchResults.filter(c => !localIds.has(c.id));
    return [...localFiltered, ...uniqueServer];
  }, [conversations, searchQuery, serverSearchResults]);

  const { isDark } = useTheme();
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';
  const inputBg = isDark ? '#1e293b' : '#f3f4f6';

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const cname = getContactName(item.meta?.sender);
    const clastMsg = item.lastNonActivityMessage?.content || (item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.content : null) || (isArabic ? 'لا يوجد محتوى' : 'No message content');
    const cassignee = item.meta?.assignee;
    const cassigneeInitial = cassignee?.name ? cassignee.name.charAt(0).toUpperCase() : 'A';
    const ctime = formatChatTime(getConversationTimestamp(item), isArabic);
    const isTyping = Boolean(typingRecords && typingRecords[item.id] && typingRecords[item.id].length > 0);
    const inbox = inboxesMap[item.inboxId] || inboxesMap[(item as any).inbox_id];
    const channelIcon = getChannelIcon(inbox?.channelType || item.meta?.channel || '', inbox?.medium || '', '');

    // 1. Lifecycle Stage
    const caStage =
      item.customAttributes?.lifecycle_stage ||
      item.customAttributes?.stage ||
      (item as any).custom_attributes?.lifecycle_stage ||
      (item as any).custom_attributes?.stage ||
      (item.additionalAttributes as any)?.lifecycle_stage ||
      item.meta?.sender?.customAttributes?.lifecycle_stage ||
      (item.meta?.sender as any)?.custom_attributes?.lifecycle_stage;

    let stageName = 'New Lead';
    let stageEmoji = '🌱';

    if (caStage) {
      const sLower = String(caStage).toLowerCase().trim();
      const match = apiLifecycleStages.find(
        s => s.name.toLowerCase() === sLower || String(s.id) === sLower || s.name.toLowerCase().replace(/\s+/g, '_') === sLower
      );
      if (match) {
        stageName = match.name;
        stageEmoji = match.icon || '🌱';
      } else {
        stageName = String(caStage).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    } else if (apiLifecycleStages.length > 0) {
      stageName = apiLifecycleStages[0].name;
      stageEmoji = apiLifecycleStages[0].icon || '🌱';
    }

    // 2. Labels
    const convLabels = Array.isArray(item.labels) ? item.labels.filter(Boolean) : [];

    return (
      <Pressable
        key={String(item.id)}
        onPress={() => (navigation as any).navigate('ChatScreen', { conversationId: Number(item.id) })}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ position: 'relative' }}>
              {item.meta?.sender?.thumbnail ? (
                <Image
                  source={{ uri: item.meta.sender.thumbnail }}
                  style={{ width: 42, height: 42, borderRadius: 999 }}
                />
              ) : (
                <View style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#d97706' }}>
                    {cname.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {channelIcon ? (
                <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: bgColor, borderRadius: 999, padding: 1 }}>
                  <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
                    {channelIcon}
                  </View>
                </View>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: textPrimary, fontSize: 15 }} numberOfLines={1}>
                {cname}
              </Text>
              {isTyping ? (
                <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                  {isArabic ? 'يكتب الآن...' : 'Typing...'}
                </Text>
              ) : (
                <Text style={{ color: textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                  {clastMsg}
                </Text>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ color: textSecondary, fontSize: 12 }}>{ctime}</Text>
            {item.unreadCount > 0 && (
              <View style={{ backgroundColor: '#22c55e', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer row with Lifecycle Stage & Labels */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingLeft: 54 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, paddingRight: 8 }}>
            {/* Lifecycle Stage Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 6, paddingHorizontal: 7 }}>
              <Text style={{ fontSize: 11 }}>{stageEmoji}</Text>
              <Text style={{ color: textPrimary, fontSize: 11, fontWeight: '600' }}>{stageName}</Text>
            </View>

            {/* Labels Badges */}
            {convLabels.slice(0, 2).map((lbl, lIdx) => {
              const lblObj = apiLabels.find(al => (al.title || '').toLowerCase() === String(lbl).toLowerCase());
              const dotColor = lblObj?.color || '#3b82f6';
              return (
                <View
                  key={lIdx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    height: 22,
                    backgroundColor: dotColor + '18',
                    borderWidth: 1,
                    borderColor: dotColor + '40',
                    borderRadius: 6,
                    paddingHorizontal: 7,
                  }}>
                  <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: dotColor }} />
                  <Text style={{ color: isDark ? '#f8fafc' : dotColor, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                    {lbl}
                  </Text>
                </View>
              );
            })}
            {convLabels.length > 2 && (
              <View style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: textSecondary }}>+{convLabels.length - 2}</Text>
              </View>
            )}
          </View>

          {/* Assignee */}
          {cassignee && (
            cassignee.thumbnail ? (
              <Image source={{ uri: cassignee.thumbnail }} style={{ width: 26, height: 26, borderRadius: 999 }} />
            ) : (
              <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{cassigneeInitial}</Text>
              </View>
            )
          )}
        </View>
      </Pressable>
    );
  };

  if (showSearch) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bgColor }}>
        <StatusBar translucent backgroundColor={bgColor} barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <SearchIcon />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={isArabic ? `البحث في صندوق ${activeLabel}...` : `Search in ${activeLabel} inbox...`}
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, color: textPrimary, fontSize: 14, textAlign: isArabic ? 'right' : 'left' }}
            />
            {isSearchingServer ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <XIcon />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); setServerSearchResults([]); }}>
            <Text style={{ color: '#3b82f6', fontWeight: '500', fontSize: 14 }}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {filteredConversations.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Text style={{ color: textSecondary, fontSize: 14 }}>
                {isArabic ? 'لا توجد نتائج مطابقة' : 'No matching results'}
              </Text>
            </View>
          ) : (
            filteredConversations.map(item => renderConversationItem({ item }))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar translucent backgroundColor={bgColor} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, backgroundColor: bgColor, position: 'relative', overflow: 'hidden' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}><HamburgerIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 20, fontWeight: '600', color: textPrimary }}>{activeLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setShowSearch(true)} hitSlop={8}><SearchIcon color={textPrimary} /></Pressable>
            <Pressable hitSlop={8}><UserCircleIcon color={textPrimary} /></Pressable>
            <Pressable onPress={() => setShowSort(true)} hitSlop={8}><FilterIcon color={textPrimary} /></Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {(['all', 'open', 'closed', 'snoozed'] as const).map(t => (
            <FilterChip
              key={t}
              label={
                isArabic
                  ? t === 'all'
                    ? 'الكل'
                    : t === 'open'
                    ? 'مفتوحة'
                    : t === 'closed'
                    ? 'مغلقة'
                    : 'مؤجلة'
                  : t.charAt(0).toUpperCase() + t.slice(1)
              }
              active={tab === t}
              onClick={() => setTab(t)}
            />
          ))}
        </View>

        {/* Conversation list */}
        {conversationsLoading && filteredConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 64 }}>
            <ChatBubbleIcon />
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {isArabic ? 'لا توجد محادثات لعرضها' : 'No conversations to show'}
            </Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isCloseToBottom =
                layoutMeasurement.height + contentOffset.y >= contentSize.height - 120 &&
                contentOffset.y > 10;
              if (isCloseToBottom) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={100}
            contentContainerStyle={{ paddingBottom: 80 }}>
            {filteredConversations.map(item => renderConversationItem({ item }))}
            {isLoadingMore && (
              <View style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '500' }}>
                  {isArabic ? 'جاري تحميل المزيد من المحادثات...' : 'Loading more conversations...'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Drawer overlay */}
        {drawerOpen && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 40, flexDirection: 'row' }} onStartShouldSetResponder={() => true} onResponderRelease={() => setDrawerOpen(false)}>
            <View style={{ height: '100%', backgroundColor: bgColor, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, width: '83%' }} onStartShouldSetResponder={() => true}>
              <InboxDrawer
                activeItem={activeItem}
                onSelect={(key, label) => { setActiveItem(key); setActiveLabel(label); }}
                onClose={() => setDrawerOpen(false)}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 96, paddingRight: 8 }}>
              <View style={{ backgroundColor: isDark ? '#1e293b' : 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '500' }}>replied</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sort Bottom Sheet */}
        {showSort && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setShowSort(false)}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: isDark ? '#1e293b' : 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#475569' : '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
              {[
                { label: 'Newest Message', value: 'newest' as const },
                { label: 'Oldest Message', value: 'oldest' as const },
              ].map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSortBy(opt.value);
                    setShowSort(false);
                  }}
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderBottomWidth: i === 1 ? 0 : 1,
                    borderBottomColor: borderColor,
                  }}>
                  <Text style={{ color: textPrimary, fontSize: 16, fontWeight: sortBy === opt.value ? '600' : '400' }}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.value && (
                    <Text style={{ color: '#2563eb', fontSize: 16, fontWeight: '700' }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default InboxScreenDesign;
