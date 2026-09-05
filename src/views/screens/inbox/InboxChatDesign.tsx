import React, { useState, useMemo, useCallback } from 'react';
import {
  Pressable,
  Modal,
  StatusBar,
  Text,
  TextInput,
  View,
  ScrollView,
  Animated,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { conversationActions } from '@/viewmodels/store/conversation/conversationActions';
import { updateConversation, clearAllConversations } from '@/viewmodels/store/conversation/conversationSlice';
import {
  selectAllConversations,
  selectConversationsLoading,
  selectConversationById,
  getMessagesByConversationId,
  selectIsAllMessagesFetched,
  selectIsAllConversationsFetched,
  selectConversationLoadError,
  selectIsLoadingMoreMessages,
  selectMessageLoadError,
} from '@/viewmodels/store/conversation/conversationSelectors';
import { selectUserId, selectUserThumbnail } from '@/viewmodels/store/auth/authSelectors';
import { selectAllInboxes } from '@/viewmodels/store/inbox/inboxSelectors';
import { ConversationService } from '@/models/services/conversationDomainService';
import {
  profileService,
  LifecycleStage,
  Label as ApiLabel,
  CannedResponse as ApiCannedResponse,
  Agent as ApiAgent,
  Inbox as ApiInbox,
} from '@/models/services/profileService';
import type { Conversation } from '@/models/types/Conversation';
import type { ConversationListResponse } from '@/viewmodels/store/conversation/conversationTypes';
import type { Message } from '@/models/types';
import { MESSAGE_TYPES } from '@/constants';
import { useTheme } from '@/theme';
import { useHaptic } from '@/utils';
import { showToast } from '@/utils/toastUtils';
import { selectLocale } from '@/viewmodels/store/settings/settingsSelectors';
import { selectTypingUsers, selectTypingUsersByConversationId } from '@/viewmodels/store/conversation/conversationTypingSlice';
import { getChannelIcon } from '@/utils/getChannelIcon';
import { conversationService } from '@/models/services/conversationService';
import { contactService } from '@/models/services/contactService';
import { transformConversation } from '@/utils/camelCaseKeys';
import { AttachmentIcon, VoiceNote, UserCircleIcon } from '@/svg-icons';
import AddContactScreen from '@/views/screens/contacts/AddContactScreen';
import { WebView } from 'react-native-webview';
import { AudioStatus, startPlayer, pausePlayer, resumePlayer } from '@/views/screens/chat-screen/components/audio-recorder';
import type { PlayBackType } from 'react-native-audio-recorder-player';
import { ChatDeliveryStatus } from './chat-design/components/ChatDeliveryStatus';
import { ChatReplyPreview } from './chat-design/components/ChatReplyPreview';
import { ChatQuoteBar } from './chat-design/components/ChatQuoteBar';
import { ChatTypingBanner } from './chat-design/components/ChatTypingBanner';
import { ChatMentionSuggestions, extractMentionQuery, insertMention } from './chat-design/components/ChatMentionSuggestions';
import { ChatSearchSheet } from './chat-design/components/ChatSearchSheet';
import { ChatMessageBubble } from './chat-design/components/ChatMessageBubble';
import { useChatTyping } from './chat-design/hooks/useChatTyping';
import { getMessageText } from './chat-design/utils/chatMessageUtils';
import { ConversationParticipantService } from '@/models/services/conversationParticipantService';
import { Swipeable } from '@/views/components/common';

// ---------- Date & Time Helpers ----------
const getConversationTimestamp = (item?: any): number => {
  if (!item) return 0;
  const candidates: number[] = [];
  const push = (v: any) => {
    if (!v) return;
    if (typeof v === 'number' && !isNaN(v) && v > 0) {
      candidates.push(v > 1e11 ? v : v * 1000);
      return;
    }
    if (typeof v === 'string') {
      const n = Number(v);
      if (!isNaN(n) && n > 0) {
        candidates.push(n > 1e11 ? n : n * 1000);
        return;
      }
      const d = new Date(v).getTime();
      if (!isNaN(d) && d > 0) {
        candidates.push(d);
        return;
      }
    }
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
  // lands in its correct position at the top instead of falling to the bottom.
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

const isArabicText = (text: string): boolean => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

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
const SearchIcon = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={2} />
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
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
const ChatBubbleIcon = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PhoneIcon = ({ color = '#626F7F' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.62 10.79z" stroke={color} strokeWidth={1.8} />
  </Svg>
);
const ResolveIcon = ({ color = '#626F7F' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M7 12l3.5 3.5L17 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MoreIcon = ({ color = '#626F7F' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={5} cy={12} r={1.5} fill={color} />
    <Circle cx={12} cy={12} r={1.5} fill={color} />
    <Circle cx={19} cy={12} r={1.5} fill={color} />
  </Svg>
);
const SnoozeIcon = ({ color = '#626F7F' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={13} r={8} stroke={color} strokeWidth={1.8} />
    <Path d="M12 9v4l2.5 2.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M8 3l4 2 4-2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const WorkflowIcon = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    <Path d="M14 17.5h7M17.5 14v7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const ShortcutIcon = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BlockSlash = ({ color = '#80838D' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const SendIcon = ({ color = '#725AFF' }: { color?: string }) => (
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
const ChatBlue = ({ color = '#725AFF' }: { color?: string }) => (
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
    <Rect x={3} y={3} width={18} height={18} rx={3} stroke="#725AFF" strokeWidth={1.8} />
    <Path d="M7 8h10M7 12h8M7 16h6" stroke="#725AFF" strokeWidth={1.5} strokeLinecap="round" />
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
          ? (isDark ? '#725AFF' : '#282E34')
          : (isDark ? '#1B1C20' : '#F0F0F3'),
        borderWidth: 1,
        borderColor: active
          ? (isDark ? '#725AFF' : '#282E34')
          : (isDark ? '#24262B' : '#EAEAEA'),
      }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: active ? '#ffffff' : (isDark ? '#B0B4BA' : '#626F7F'),
        }}>
        {label}
      </Text>
    </Pressable>
  );
};

// ---------- Sheet wrapper (bottom) ----------
const BottomSheet = ({ children, onClose, bottomOffset = 0 }: { children: React.ReactNode; onClose: () => void; bottomOffset?: number }) => {
  const { isDark } = useTheme();
  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={onClose}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <View style={{ position: 'absolute', bottom: bottomOffset, left: 0, right: 0, backgroundColor: isDark ? '#1B1C20' : 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
        <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#31343A' : '#EAEAEA', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />
        {children}
      </View>
    </View>
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
  isDark,
}: {
  activeItem: string;
  onSelect: (key: string, label: string) => void;
  onClose: () => void;
  isDark: boolean;
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

  const apiAllCount = conversationMeta?.allCount || conversations.length;
  const apiMineCount = conversationMeta?.mineCount ?? conversations.filter(c => c.meta?.assignee?.id === userId).length;
  const apiUnassignedCount = conversationMeta?.unassignedCount ?? conversations.filter(c => !c.meta?.assignee).length;

  const mainItems = useMemo(() => [
    { key: 'all', label: 'All', icon: <InboxDrawerIcon color={isDark ? '#EAEAEA' : '#626F7F'} />, count: apiAllCount },
    { key: 'mine', label: 'Mine', icon: <MineIcon color={isDark ? '#EAEAEA' : '#725AFF'} />, count: apiMineCount },
    { key: 'unassigned', label: 'Unassigned', icon: <UnassignedIcon color={isDark ? '#EAEAEA' : '#626F7F'} />, count: apiUnassignedCount },
  ], [apiAllCount, apiMineCount, apiUnassignedCount, isDark]);

const matchesStage = (c: any, stageName: string, stageId?: number): boolean => {
  if (!c) return false;
  const sLower = stageName.toLowerCase().trim();
  const sKey = sLower.replace(/\s+/g, '_');
  const sFirst = sLower.split(/\s+/)[0];
  const senderStage = c.meta?.sender?.lifecycleStage ?? c.meta?.sender?.lifecycle_stage;

  if (
    (stageId && String(senderStage?.id) === String(stageId)) ||
    (senderStage?.name && senderStage.name.toLowerCase().trim() === sLower)
  ) {
    return true;
  }

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

  const lifecycle = useMemo(() => (
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
  }), [apiLifecycleStages, conversations]);

  const bgColor = isDark ? '#101113' : '#ffffff';
  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const dividerColor = isDark ? '#1B1C20' : '#F0F0F3';
  const activeItemBg = isDark ? '#1B1C20' : 'rgba(114,90,255,0.10)';
  const activeItemText = isDark ? '#725AFF' : '#725AFF';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: textPrimary }}>Inbox</Text>
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
              <Text style={{ color: isActive ? activeItemText : '#80838D', fontSize: 14, fontWeight: '500' }}>{count}</Text>
            </Pressable>
          );
        })}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        {/* Lifecycle Stages */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setLifecycleOpen(!lifecycleOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LifecycleIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <Text style={{ fontWeight: '600', color: textPrimary }}>Lifecycle Stages</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
        </Pressable>
        {lifecycleOpen && lifecycle.map(({ key, label, emoji, count }) => (
          <Pressable key={key} onPress={() => { onSelect(key, label); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{emoji}</Text>
              <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>{label}</Text>
            </View>
            <Text style={{ color: '#80838D', fontSize: 14, fontWeight: '500' }}>{count}</Text>
          </Pressable>
        ))}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        {/* Labels Section */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setLabelsOpen(!labelsOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={isDark ? '#2CA54A' : '#2CA54A'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Line x1={7} y1={7} x2={7.01} y2={7} stroke={isDark ? '#2CA54A' : '#2CA54A'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontWeight: '600', color: textPrimary }}>Labels</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
        </Pressable>
        {labelsOpen && (
          apiLabels && apiLabels.length > 0 ? (
            apiLabels.map(lbl => {
              const count = conversations.filter(c => Array.isArray(c.labels) && c.labels.some((l: any) => typeof l === 'string' && l.toLowerCase() === lbl.title.toLowerCase())).length;
              const labelColor = lbl.color || '#2CA54A';
              return (
                <Pressable
                  key={lbl.id}
                  onPress={() => {
                    onSelect(`label_${lbl.title}`, lbl.title);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginHorizontal: 16,
                    marginVertical: 3,
                  }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 1,
                    gap: 4,
                    height: 18,
                    backgroundColor: isDark ? labelColor + '28' : labelColor + '18',
                    borderWidth: 1,
                    borderColor: isDark ? labelColor + '60' : labelColor + '40',
                    borderRadius: 5,
                    paddingHorizontal: 5,
                  }}>
                    <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: labelColor }} />
                    <Text style={{ color: isDark ? '#ffffff' : labelColor, fontSize: 10, fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>
                      {lbl.title}
                    </Text>
                  </View>
                  <Text style={{ color: '#80838D', fontSize: 14, fontWeight: '500', marginLeft: 8 }}>{count}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#80838D', fontSize: 14 }}>No labels available</Text>
          )
        )}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        {/* Inboxes */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setCustoOpen(!custoOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <InboxDrawerIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <Text style={{ fontWeight: '600', color: textPrimary }}>Inboxes</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
        </Pressable>
        {custoOpen && (
          inboxes && inboxes.length > 0 ? (
            inboxes.map(inbox => (
              <Pressable key={inbox.id} onPress={() => { onSelect(`inbox_${inbox.id}`, inbox.name); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ChatBubbleIcon2 />
                  <Text style={{ color: textSecondary, fontWeight: '500' }}>{inbox.name}</Text>
                </View>
                <Text style={{ color: '#80838D', fontSize: 14 }}>{conversations.filter(c => c.inboxId === inbox.id).length}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#80838D', fontSize: 14 }}>No inboxes available</Text>
          )
        )}
      </ScrollView>
    </View>
  );
};

// ---------- Chat Screen (ConversationDetailScreen) ----------
export const ChatScreenDesign = ({ conversationId, onBack }: { conversationId: number; onBack: () => void }) => {
  const dispatch = useAppDispatch();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const stageSheetMaxHeight = Math.min(420, Math.max(260, screenWidth * 0.72));
  const scrollViewRef = React.useRef<any>(null);
  const messagePositionsRef = React.useRef<Record<number, number>>({});
  const initialScrolledRef = React.useRef(false);
  const shouldScrollToEndRef = React.useRef(false);
  const loadingOlderRef = React.useRef(false);
  const conversationIdRef = React.useRef(conversationId);
  const isNearBottomRef = React.useRef(true);
  const [showNewMessagesBadge, setShowNewMessagesBadge] = useState(false);
  const currentUserId = useAppSelector(selectUserId);
  const currentUserThumbnail = useAppSelector(selectUserThumbnail);
  const isAllMessagesFetched = useAppSelector(selectIsAllMessagesFetched(conversationId));
  const isLoadingMoreMessages = useAppSelector(selectIsLoadingMoreMessages);
  const messageLoadError = useAppSelector(selectMessageLoadError);
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const messages = useAppSelector(state => getMessagesByConversationId(state, { conversationId }));
  const messageMap = React.useMemo(() => {
    const map = new Map<number | string, (typeof messages)[0]>();
    for (let i = 0; i < messages.length; i++) {
      map.set(messages[i].id, messages[i]);
    }
    return map;
  }, [messages]);
  const [sheet, setSheet] = useState<null | 'menu' | 'search' | 'attachment' | 'assign' | 'stage' | 'snooze' | 'shortcut' | 'workflow' | 'labels' | 'collaborators'>(
    route.params?.openSheet || (route.params?.openMenu ? 'menu' : null),
  );
  const [message, setMessage] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [shortcutSearch, setShortcutSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<number[]>([]);
  const [collaboratorAgents, setCollaboratorAgents] = useState<ApiAgent[]>([]);
  const firstLabel = conversation?.labels?.[0] || '';
  const [stage, setStage] = useState(
    firstLabel
      ? firstLabel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'New Lead',
  );
  const [stageEmoji, setStageEmoji] = useState('🌱');
  const [showContactDetails, setShowContactDetails] = useState(Boolean(route.params?.openContact));
  const [fileViewer, setFileViewer] = useState<{ uri: string; name: string } | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const [customSnoozeOpen, setCustomSnoozeOpen] = useState(false);
  const [customSnoozeDateText, setCustomSnoozeDateText] = useState('');
  const [customSnoozeTimeText, setCustomSnoozeTimeText] = useState('');

  React.useEffect(() => {
    if (route.params?.openMenu) {
      setSheet('menu');
      (navigation as any).setParams({ openMenu: undefined });
    }
    if (route.params?.openSheet) {
      setSheet(route.params.openSheet);
      (navigation as any).setParams({ openSheet: undefined });
    }
  }, [navigation, route.params?.openMenu]);
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

  // Android/Fabric can retain the reduced KeyboardAvoidingView height after
  // dismissal. Re-mounting it resets the composer to its original position.
  const [keyboardAvoiderKey, setKeyboardAvoiderKey] = useState(0);
  const [chatKeyboardHeight, setChatKeyboardHeight] = useState(0);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      event => {
        setChatKeyboardHeight(event.endCoordinates.height);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setChatKeyboardHeight(0);
        setKeyboardAvoiderKey(key => key + 1);
        // The re-mounted ScrollView starts at its top; restore the current
        // conversation position after the layout has settled.
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
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
    if (loadingOlderRef.current || !oldestMessageId || isAllMessagesFetched) return;
    loadingOlderRef.current = true;
    try {
      await dispatch(
        conversationActions.fetchPreviousMessages({
          conversationId,
          beforeId: oldestMessageId,
        } as any),
      ).unwrap();
    } catch {
      // Error state is handled by the reducer
    } finally {
      loadingOlderRef.current = false;
    }
  };

  const retryLoadMessages = useCallback(() => {
    loadPreviousMessages();
  }, [conversationId, oldestMessageId, isAllMessagesFetched]);

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);

  React.useEffect(() => {
    if (isInitialLoadDone && messages.length > 0 && !initialScrolledRef.current) {
      initialScrolledRef.current = true;
      setIsChatReady(true);
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [isInitialLoadDone, messages.length]);

  React.useEffect(() => {
    conversationIdRef.current = conversationId;
    initialScrolledRef.current = false;
    setIsInitialLoadDone(false);
    setIsChatReady(false);
    setShowNewMessagesBadge(false);
    isNearBottomRef.current = true;
    loadingOlderRef.current = false;

    dispatch(conversationActions.fetchConversation(conversationId));
    dispatch(conversationActions.fetchPreviousMessages({ conversationId, beforeId: null } as any))
      .unwrap()
      .catch(() => {})
      .finally(() => {
        // Guard against stale responses from a previous conversation
        if (conversationIdRef.current === conversationId) {
          setIsInitialLoadDone(true);
        }
      });
    dispatch(conversationActions.markMessageRead({ conversationId }) as any);
  }, [conversationId]);

  const prevLastMsgIdRef = React.useRef<number | string | null>(null);
  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== prevLastMsgIdRef.current) {
        prevLastMsgIdRef.current = lastMsg.id;
        if (initialScrolledRef.current) {
          if (isNearBottomRef.current) {
            requestAnimationFrame(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            });
          } else {
            setShowNewMessagesBadge(true);
          }
        }
      }
    }
  }, [messages]);

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
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      scrollViewRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
    }
  }, [messages]);

  const handleLayoutMessage = useCallback((id: number, y: number) => {
    messagePositionsRef.current[id] = y;
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
      sender: { id: currentUserId!, thumbnail: currentUserThumbnail },
      contentAttributes: quotedMessage ? { inReplyTo: quotedMessage.id } : undefined,
    }));
    setMessage('');
    setQuotedMessage(null);
    stopTyping();
  }, [conversation?.canReply, conversationId, currentUserId, currentUserThumbnail, dispatch, isArabic, isPrivate, message, quotedMessage, stopTyping]);

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
      if (conversation) {
        dispatch(updateConversation({ ...conversation, labels: newLabels }));
      }
      showToast({ message: exists ? `Removed "${labelTitle}"` : `Added "${labelTitle}"` });
    } catch (e) {
    }
  };

  const handleCustomSnoozeSubmit = async () => {
    const snoozedUntil = new Date(`${customSnoozeDateText}T${customSnoozeTimeText}:00`);
    if (Number.isNaN(snoozedUntil.getTime()) || snoozedUntil.getTime() <= Date.now()) {
      showToast({ message: isArabic ? 'اختر تاريخًا ووقتًا صحيحين في المستقبل' : 'Choose a valid future date and time' });
      return;
    }
    try {
      await dispatch(
        conversationActions.toggleConversationStatus({
          conversationId,
          payload: { status: 'snoozed', snoozed_until: Math.floor(snoozedUntil.getTime() / 1000) },
        }),
      ).unwrap();
      setCustomSnoozeOpen(false);
      setSheet(null);
    } catch {
      showToast({ message: isArabic ? 'تعذر تأجيل المحادثة' : 'Failed to snooze conversation' });
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
    }
  };

  const openCollaborators = async () => {
    setCollaboratorSearch('');
    setCollaboratorAgents(assignableAgents);
    setSheet('collaborators');
    try {
      const result = await ConversationParticipantService.index({ conversationId });
      setCollaboratorIds(result.participants.map(participant => participant.id));
    } catch (e) {
    }
  };

  const handleSaveCollaborators = async () => {
    try {
      await ConversationParticipantService.update({ conversationId, userIds: collaboratorIds });
      showToast({ message: 'Collaborators updated' });
      setSheet(null);
    } catch (e) {
      showToast({ message: 'Failed to update collaborators' });
    }
  };

  const contactId = conversation?.meta?.sender?.id;

  React.useEffect(() => {
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

  // Fetch and sync contact's actual lifecycle stage
  React.useEffect(() => {
    if (!contactId) return;
    Promise.all([
      contactService.getContact(contactId),
      profileService.listLifecycleStages(),
    ])
      .then(([contact, stages]) => {
        if (stages && Array.isArray(stages) && stages.length > 0) {
          setApiStages(stages);
        }
        const rawStageId = (contact as any)?.lifecycle_stage_id ?? (contact as any)?.custom_attributes?.lifecycle_stage_id;
        const rawStageName = (contact as any)?.custom_attributes?.lifecycle_stage;

        if (stages && stages.length > 0) {
          const match = stages.find(s =>
            (rawStageId && String(s.id) === String(rawStageId)) ||
            (rawStageName && (s.name.toLowerCase() === String(rawStageName).toLowerCase() || s.name.toLowerCase().replace(/\s+/g, '_') === String(rawStageName).toLowerCase()))
          );
          if (match) {
            setStage(match.name);
            setStageEmoji(match.icon || '🌱');
            return;
          }
        }
        if (rawStageName) {
          setStage(String(rawStageName).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
      })
      .catch(() => {});
  }, [contactId]);

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
            sender: { id: currentUserId!, thumbnail: currentUserThumbnail },
            file: fileObj,
          }),
        );
      }
    } catch (e) {
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
        sender: { id: currentUserId!, thumbnail: currentUserThumbnail },
        file: {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `attachment-${Date.now()}-${index}.jpg`,
        },
      }));
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
          sender: { id: currentUserId!, thumbnail: currentUserThumbnail },
          file: { uri, type: 'audio/m4a', name: 'voice-message.m4a' },
        }));
      }
    } catch (e) {
      recordingRef.current = null;
      setIsRecording(false);
      showToast({ message: isArabic ? 'تعذر حفظ التسجيل الصوتي' : 'Unable to save voice recording' });
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
    }
  };

  const lifecycleStages =
    apiStages.length > 0
      ? apiStages.map(s => ({ id: s.id, emoji: s.icon || '🌱', label: s.name }))
      : [
          { id: 1, emoji: '🆕', label: 'New Lead' },
          { id: 2, emoji: '🔥', label: 'Hot Lead' },
          { id: 3, emoji: '💵', label: 'Payment' },
          { id: 4, emoji: '😍', label: 'Customer' },
        ];

  const updateLifecycleStage = async (selectedStage?: { id?: number; emoji: string; label: string }) => {
    try {
      if (contactId) {
        if (selectedStage) {
          await contactService.updateContact(contactId, {
            lifecycle_stage_id: selectedStage.id ?? null,
            custom_attributes: {
              lifecycle_stage: selectedStage.label,
              ...(selectedStage.id ? { lifecycle_stage_id: selectedStage.id } : {}),
            },
          });
        } else {
          await contactService.updateContact(contactId, {
            lifecycle_stage_id: null,
            custom_attributes: {
              lifecycle_stage: null,
              lifecycle_stage_id: null,
            },
          });
        }
      }

      if (selectedStage) {
        setStage(selectedStage.label);
        setStageEmoji(selectedStage.emoji);
      } else {
        setStage('New Lead');
        setStageEmoji('🌱');
      }

      // Update Redux state locally so sender has the new lifecycle stage info
      if (conversation) {
        const currentSender = conversation.meta?.sender;
        if (currentSender) {
          const updatedSender = {
            ...currentSender,
            lifecycle_stage_id: selectedStage?.id ?? null,
            lifecycleStage: selectedStage
              ? { id: selectedStage.id, name: selectedStage.label, icon: selectedStage.emoji }
              : null,
            customAttributes: {
              ...(currentSender.customAttributes || {}),
              lifecycle_stage: selectedStage ? selectedStage.label : undefined,
              lifecycle_stage_id: selectedStage?.id ?? undefined,
            },
          };
          dispatch(
            updateConversation({
              ...conversation,
              meta: {
                ...conversation.meta,
                sender: updatedSender,
              },
            }),
          );
        }
      }
      showToast({ message: selectedStage ? `Stage: ${selectedStage.label}` : 'Stage cleared' });
    } catch (e) {
      showToast({ message: isArabic ? 'تعذر تحديث المرحلة' : 'Unable to update lifecycle stage' });
    } finally {
      setSheet(null);
    }
  };

  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const bgColor = isDark ? '#101113' : '#ffffff';
  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#1B1C20' : '#F0F0F3';
  const inputContainerBg = isDark ? '#1B1C20' : '#ffffff';
  const inputBorderColor = isDark ? '#24262B' : '#EAEAEA';
  const toolbarBorderColor = isDark ? '#24262B' : '#F0F0F3';

  if (showContactDetails) {
    return <ContactDetailsScreen conversation={conversation as Conversation} onBack={() => setShowContactDetails(false)} />;
  }


  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar translucent backgroundColor={bgColor} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        key={keyboardAvoiderKey}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        {/* Header row 1 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: borderColor }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={onBack} hitSlop={8}><ArrowLeft color={textPrimary} /></Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => {
                  if (conversation?.meta?.sender?.thumbnail) {
                    setFileViewer({ uri: conversation.meta.sender.thumbnail, name });
                  } else {
                    setShowContactDetails(true);
                  }
                }}
                hitSlop={4}>
                {conversation?.meta?.sender?.thumbnail ? (
                  <Image
                    source={{ uri: conversation.meta.sender.thumbnail }}
                    style={{ width: 36, height: 36, borderRadius: 999 }}
                  />
                ) : (
                  <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: '#FA8900', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={() => setShowContactDetails(true)} hitSlop={4}>
                <Text style={{ fontWeight: '600', color: textPrimary, fontSize: 16 }}>{name}</Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 }}>
              <PhoneIcon color={isDark ? '#94a3b8' : '#626F7F'} />
              <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
            </Pressable>
            <Pressable
              hitSlop={8}
              style={{
                padding: 6,
                backgroundColor: conversation?.status === 'resolved' ? (isDark ? '#1B1C20' : 'rgba(44,165,74,0.15)') : (isDark ? '#24262B' : '#F0F0F3'),
                borderRadius: 999,
              }}
              onPress={async () => {
                const nextStatus = conversation?.status === 'resolved' ? 'open' : 'resolved';
                try {
                  await dispatch(
                    conversationActions.toggleConversationStatus({
                      conversationId,
                      payload: { status: nextStatus },
                    }),
                  ).unwrap();
                  showToast({ message: nextStatus === 'resolved' ? 'Conversation resolved' : 'Conversation reopened' });
                } catch {
                  showToast({ message: 'Failed to update status' });
                }
              }}>
              <ResolveIcon color={conversation?.status === 'resolved' ? '#2CA54A' : (isDark ? '#94a3b8' : '#626F7F')} />
            </Pressable>
            <Pressable hitSlop={8} style={{ padding: 4 }} onPress={() => setSheet('menu')}><MoreIcon color={isDark ? '#94a3b8' : '#626F7F'} /></Pressable>
          </View>
        </View>

        {/* Header row 2 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderColor }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setSheet('assign')}>
            {conversation?.meta?.assignee?.thumbnail ? (
              <Image source={{ uri: conversation.meta.assignee.thumbnail }} style={{ width: 24, height: 24, borderRadius: 999 }} />
            ) : (
              <View style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                  {conversation?.meta?.assignee?.name ? conversation.meta.assignee.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 14, color: textSecondary, fontWeight: '500' }}>
              {conversation?.meta?.assignee?.name || 'Unassigned'}
            </Text>
            <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
          </Pressable>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: isDark ? '#24262B' : '#EAEAEA', backgroundColor: isDark ? '#1B1C20' : '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 'auto', maxWidth: '52%', flexShrink: 1 }} onPress={() => setSheet('stage')}>
            <Text style={{ fontSize: 14 }}>{stageEmoji}</Text>
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: textPrimary, flexShrink: 1 }}>{stage}</Text>
            <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
          </Pressable>

          <Pressable
            hitSlop={8}
            style={{
              marginLeft: 4,
              padding: 5,
              borderRadius: 8,
              backgroundColor: conversation?.status === 'snoozed'
                ? (isDark ? '#1e3a8a' : '#dbeafe')
                : 'transparent',
              borderWidth: conversation?.status === 'snoozed' ? 1 : 0,
              borderColor: conversation?.status === 'snoozed'
                ? (isDark ? '#725AFF' : '#725AFF')
                : 'transparent',
            }}
            onPress={() => setSheet('snooze')}>
            <SnoozeIcon color={conversation?.status === 'snoozed' ? '#725AFF' : (isDark ? '#94a3b8' : '#626F7F')} />
          </Pressable>
        </View>

        {conversation?.status === 'snoozed' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: isDark ? '#1B1C20' : 'rgba(114,90,255,0.10)',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#1e3a8a' : '#bfdbfe',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <SnoozeIcon color="#725AFF" />
              <Text style={{ fontSize: 12.5, color: isDark ? '#725AFF' : '#725AFF', fontWeight: '600' }} numberOfLines={1}>
                {isArabic
                  ? (conversation?.snoozedUntil ? `مؤجلة حتى ${formatChatTime(conversation.snoozedUntil, isArabic)}` : 'مؤجلة حتى الرد القادم')
                  : (conversation?.snoozedUntil ? `Snoozed until ${formatChatTime(conversation.snoozedUntil, isArabic)}` : 'Snoozed until next reply')}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={async () => {
                hapticTrigger?.();
                try {
                  await dispatch(
                    conversationActions.toggleConversationStatus({
                      conversationId,
                      payload: { status: 'open' },
                    }),
                  ).unwrap();
                  showToast({ message: isArabic ? 'تم إلغاء التأجيل وفتح المحادثة' : 'Conversation reopened' });
                } catch (e) {
                  showToast({ message: isArabic ? 'تعذر فتح المحادثة' : 'Failed to reopen' });
                }
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#725AFF' }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                {isArabic ? 'إلغاء التأجيل' : 'Reopen'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Chat area */}
        <View style={{ flex: 1, position: 'relative' }}>
        <FlashList
          ref={scrollViewRef}
          data={messages}
          renderItem={({ item: m, index: idx }) => {
            const showDateHeader = idx === 0 || !isSameDay(messages[idx - 1]?.createdAt, m.createdAt);

            return (
              <ChatMessageBubble
                message={m}
                index={idx}
                isDark={isDark}
                isArabic={isArabic}
                contactName={name}
                conversation={conversation}
                messageMap={messageMap}
                highlightedMessageId={highlightedMessageId}
                showDateHeader={showDateHeader}
                onLayout={handleLayoutMessage}
                onScrollToMessage={scrollToMessage}
                onSetQuotedMessage={setQuotedMessage}
                onOpenFileViewer={(uri, name) => setFileViewer({ uri, name })}
                onRetryMessage={(retryMsg) => {
                  const retryText = getMessageText(retryMsg);
                  if (!retryText) {
                    showToast({
                      message: isArabic
                        ? 'تعذر إعادة إرسال هذه الرسالة'
                        : 'This message cannot be retried',
                    });
                    return;
                  }
                  dispatch(
                    conversationActions.sendMessage({
                      conversationId,
                      message: retryText,
                      private: false,
                      sender: { id: currentUserId!, thumbnail: currentUserThumbnail },
                    }),
                  );
                }}
              />
            );
          }}
          keyExtractor={item => String(item.id ?? Math.random())}
          estimatedItemSize={80}
          scrollEnabled={isChatReady}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          onScroll={({ nativeEvent }) => {
            if (!initialScrolledRef.current || !isInitialLoadDone) return;

            const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
            const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
            isNearBottomRef.current = distanceFromBottom < 100;

            if (isNearBottomRef.current) {
              setShowNewMessagesBadge(false);
            }

            // Trigger pagination when near top
            if (
              contentOffset.y <= contentSize.height * 0.25 &&
              !loadingOlderRef.current &&
              !isAllMessagesFetched
            ) {
              loadPreviousMessages();
            }
          }}
          onEndReached={() => {
            // Fallback pagination trigger for FlashList
            if (!loadingOlderRef.current && !isAllMessagesFetched) {
              loadPreviousMessages();
            }
          }}
          onEndReachedThreshold={0.3}
          style={{ flex: 1, paddingHorizontal: 16, opacity: isChatReady ? 1 : 0 }}
          ListHeaderComponent={
            isAllMessagesFetched ? (
              <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16, paddingHorizontal: 20 }}>
                <Pressable
                  onPress={() => {
                    if (conversation?.meta?.sender?.thumbnail) {
                      setFileViewer({ uri: conversation.meta.sender.thumbnail, name });
                    }
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    backgroundColor: isDark ? '#1B1C20' : '#F0F0F3',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    borderWidth: 1.5,
                    borderColor: isDark ? '#24262B' : '#EAEAEA',
                  }}>
                  {conversation?.meta?.sender?.thumbnail ? (
                    <Image source={{ uri: conversation.meta.sender.thumbnail }} style={{ width: 48, height: 48, borderRadius: 999 }} />
                  ) : (
                    <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#725AFF' : '#725AFF' }}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </Pressable>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary, marginBottom: 2 }}>{name}</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#80838D', textAlign: 'center' }}>
                  Conversation with <Text style={{ fontWeight: '600', color: textPrimary }}>{name}</Text>
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 13, color: isDark ? '#80838D' : '#80838D' }}>No messages yet</Text>
            </View>
          }
          ListFooterComponent={
            <>
              {isLoadingMoreMessages && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={isDark ? '#725AFF' : '#725AFF'} />
                </View>
              )}
              {!isLoadingMoreMessages && messageLoadError && (
                <Pressable
                  onPress={retryLoadMessages}
                  style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#725AFF' : '#725AFF', fontSize: 13, fontWeight: '600' }}>
                    {isArabic ? 'فشل التحميل - اضغط للإعادة' : 'Failed to load - tap to retry'}
                  </Text>
                </Pressable>
              )}
              {isAllMessagesFetched && messages.length > 0 && !isLoadingMoreMessages && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#31343A' : '#80838D', fontSize: 12 }}>
                    {isArabic ? '— جميع الرسائل —' : '— All messages —'}
                  </Text>
                </View>
              )}
            </>
          }
        />

        {!isChatReady && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <ActivityIndicator size="large" color={isDark ? '#725AFF' : '#725AFF'} />
          </View>
        )}

        {showNewMessagesBadge && isChatReady && (
          <Pressable
            onPress={() => {
              setShowNewMessagesBadge(false);
              isNearBottomRef.current = true;
              requestAnimationFrame(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              });
            }}
            style={{
              position: 'absolute',
              bottom: 12,
              alignSelf: 'center',
              backgroundColor: isDark ? '#725AFF' : '#282E34',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
              zIndex: 20,
            }}>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
              {isArabic ? '↓ رسائل جديدة' : '↓ New messages'}
            </Text>
          </Pressable>
        )}
        </View>

        <ChatTypingBanner typingText={typingText} isDark={isDark} />

        {/* Input area */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: isPrivate
            ? (isDark ? '#1B1C20' : 'rgba(250,137,0,0.15)')
            : (isDark ? '#1B1C20' : '#EAEAEA'),
          backgroundColor: isPrivate
            ? (isDark ? '#1c1400' : '#fffdf0')
            : inputContainerBg,
          paddingBottom: Math.max(insets.bottom, 8),
        }}>
          {!isPrivate && conversation?.canReply === false ? (
            <View style={{ marginHorizontal: 16, marginTop: 8, borderRadius: 8, backgroundColor: isDark ? '#1B1C20' : 'rgba(250,137,0,0.10)', paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text style={{ color: isDark ? '#fed7aa' : '#9a3412', fontSize: 12, fontWeight: '600' }}>
                {isArabic ? 'لا يمكن الرد على هذه المحادثة حاليًا.' : 'Replies are currently unavailable for this conversation.'}
              </Text>
            </View>
          ) : null}
          {/* Private note banner */}
          {isPrivate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingTop: 8 }}>
              <LockIcon size={12} color={isDark ? '#FA8900' : '#FA8900'} />
              <Text style={{ color: isDark ? '#FA8900' : '#FA8900', fontSize: 12, fontWeight: '600' }}>
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
                <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: '#FF382E', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 17 }}>●</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <Text style={{ color: isDark ? '#fecdd3' : '#9f1239', fontSize: 13, fontWeight: '700' }}>{isArabic ? 'جارٍ التسجيل' : 'Recording voice message'}</Text>
                    <Text style={{ color: '#FF382E', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</Text>
                  </View>
                  <View style={{ height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: isDark ? '#7f1d1d' : '#fecdd3' }}>
                    <View style={{ width: `${18 + (recordingSeconds % 7) * 11}%`, height: '100%', borderRadius: 999, backgroundColor: '#FF382E' }} />
                  </View>
                </View>
                <Pressable onPress={() => finishVoiceRecording(false)} hitSlop={10} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
                  <Text style={{ color: isDark ? '#fecdd3' : '#9f1239', fontSize: 13, fontWeight: '700' }}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
                </Pressable>
                <Pressable onPress={() => finishVoiceRecording(true)} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
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
                placeholderTextColor={isDark ? '#80838D' : '#80838D'}
                style={{ flex: 1, color: textPrimary, fontSize: 14, maxHeight: 100 }}
              />
              <Pressable
                hitSlop={8}
                onPress={sendCurrentMessage}>
                <SendIcon color={isPrivate ? (isDark ? '#FA8900' : '#FA8900') : '#725AFF'} />
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
                  borderColor: isDark ? '#24262B' : '#EAEAEA',
                  borderRadius: 10,
                  backgroundColor: isDark ? '#1B1C20' : '#ffffff',
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
                      borderBottomColor: isDark ? '#24262B' : '#F0F0F3',
                    }}>
                    <Text style={{ color: '#725AFF', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
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
            paddingBottom: 4,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: isPrivate
              ? (isDark ? '#1B1C20' : 'rgba(250,137,0,0.15)')
              : (isDark ? '#24262B' : '#F0F0F3'),
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
                  ? (isDark ? '#1B1C20' : 'rgba(250,137,0,0.15)')
                  : 'transparent',
              }}>
              {isPrivate
                ? <LockIcon size={20} color={isDark ? '#FA8900' : '#FA8900'} />
                : <ChatBlue color="#725AFF" />
              }
            </Pressable>
            <View style={{ width: 1, height: 20, backgroundColor: isPrivate ? (isDark ? '#1B1C20' : 'rgba(250,137,0,0.15)') : (isDark ? '#24262B' : '#EAEAEA') }} />
            <Pressable hitSlop={8} style={{ width: 24, height: 24 }} onPress={() => setSheet('attachment')}>
              <AttachmentIcon stroke={isPrivate ? (isDark ? '#FA8900' : '#FA8900') : '#725AFF'} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setSheet('shortcut')}>
              <ShortcutBlue />
            </Pressable>
            <Pressable hitSlop={8} style={{ width: 24, height: 24 }} onPress={handleVoicePress}>
              <VoiceNote stroke={isRecording ? '#FF382E' : (isDark ? '#94a3b8' : '#626F7F')} />
            </Pressable>
          </View> : null}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(fileViewer)} transparent animationType="fade" onRequestClose={() => setFileViewer(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
            <Pressable onPress={() => setFileViewer(null)} hitSlop={12} style={{ padding: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <XIcon color="#ffffff" />
            </Pressable>
            <Text style={{ flex: 1, marginHorizontal: 16, color: '#ffffff', fontSize: 16, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
              {fileViewer?.name}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          {fileViewer ? (
            fileViewer.uri.startsWith('http') || fileViewer.uri.startsWith('file') || fileViewer.uri.startsWith('content') || fileViewer.uri.startsWith('data:') ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                <Image source={{ uri: fileViewer.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            ) : (
              <WebView source={{ uri: fileViewer.uri }} style={{ flex: 1 }} startInLoadingState />
            )
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* ===== Modals ===== */}
      {sheet === 'menu' && (
        <BottomSheet onClose={() => { setCustomSnoozeOpen(false); setSheet(null); }} bottomOffset={customSnoozeOpen ? chatKeyboardHeight : 0}>
          {[
            {
              icon: <ResolveIcon color={textPrimary} />,
              label: isArabic ? 'إغلاق المحادثة' : 'Close Conversation',
              onPress: async () => {
                setSheet(null);
                await dispatch(conversationActions.toggleConversationStatus({
                  conversationId,
                  payload: { status: 'resolved' },
                }));
              },
            },
            { icon: <LifecycleIcon color={textPrimary} />, label: isArabic ? 'اختيار مرحلة العميل' : 'Select Lifecycle Stage', onPress: () => setSheet('stage') },
            { icon: <UserCircleIcon color={textPrimary} />, label: isArabic ? 'تعيين مستخدم' : 'Assign User', onPress: () => setSheet('assign') },
            { icon: <TeamIcon color={textPrimary} />, label: isArabic ? 'المتعاونون' : 'Collaborators', onPress: openCollaborators },
            { icon: <ShortcutIcon color={textPrimary} />, label: isArabic ? 'اختيار اختصار' : 'Select Shortcut', onPress: () => setSheet('shortcut') },
            { icon: <SnoozeIcon color={textPrimary} />, label: isArabic ? 'تأجيل المحادثة' : 'Snooze Conversation', onPress: () => setSheet('snooze') },
            { icon: <UserCircleIcon color={textPrimary} />, label: isArabic ? 'عرض تفاصيل العميل' : 'View Contact Details', onPress: () => { setSheet(null); setShowContactDetails(true); } },
          ].map((item, i) => (
            <Pressable key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: i === 6 ? 0 : 1, borderBottomColor: borderColor }} onPress={item.onPress}>
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
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <TextInput
              value={assignSearch}
              onChangeText={setAssignSearch}
              placeholder="Search agents..."
              placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {assignSearch ? (
              <Pressable onPress={() => setAssignSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#626F7F'} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
            onPress={handleAssignToMe}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ position: 'relative', width: 36, height: 36, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Me</Text>
                <View style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 999, backgroundColor: '#2CA54A', borderWidth: 2, borderColor: isDark ? '#1B1C20' : '#fff' }} />
              </View>
              <Text style={{ color: textPrimary, fontWeight: '500' }}>Assign to me</Text>
            </View>
            {conversation?.meta?.assignee?.id === currentUserId && (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </Pressable>

          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
            onPress={handleUnassign}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: isDark ? '#24262B' : 'rgba(114,90,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={8} r={4} fill={isDark ? '#94a3b8' : '#725AFF'} />
                  <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={isDark ? '#94a3b8' : '#725AFF'} />
                </Svg>
              </View>
              <Text style={{ color: textPrimary, fontWeight: '500' }}>Unassign</Text>
            </View>
            {!conversation?.meta?.assignee && (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
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
                        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{ag.name ? ag.name.charAt(0).toUpperCase() : 'A'}</Text>
                        </View>
                      )}
                      <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>{ag.name || ag.available_name}</Text>
                    </View>
                    {conversation?.meta?.assignee?.id === ag.id && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
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
            <Pressable onPress={() => setSheet(null)}><Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
          </View>
          <Pressable style={{ width: '100%', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderColor }} onPress={() => updateLifecycleStage()}>
            <Text style={{ color: textSecondary, fontWeight: '500' }}>Clear Selection</Text>
          </Pressable>
          <Text style={{ paddingHorizontal: 20, color: '#725AFF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>Lifecycle Stages</Text>
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
          <Text style={{ paddingHorizontal: 20, color: '#725AFF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>Lost Stages</Text>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }} onPress={() => updateLifecycleStage({ label: 'Cold Lead', emoji: '🧊' })}>
            <Text style={{ fontSize: 20 }}>🧊</Text>
            <Text style={{ color: textPrimary, fontWeight: '500' }}>Cold Lead</Text>
          </Pressable>
        </BottomSheet>
      )}

      {sheet === 'snooze' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SnoozeIcon color="#725AFF" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: textPrimary }}>
                  {isArabic ? 'تأجيل المحادثة' : 'Snooze Conversation'}
                </Text>
              </View>
              <Pressable onPress={() => setSheet(null)} hitSlop={8}>
                <XIcon color={textPrimary} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>
              {isArabic
                ? `سيتم إخفاء المحادثة مع ${name} مؤقتاً حتى الوقت المحدد أو حتى يرسل العميل رداً جديداً.`
                : `Temporarily snooze conversation with ${name} until selected time or until next customer reply.`}
            </Text>

            <View style={{ gap: 8, paddingBottom: 24 }}>
              {conversation?.status === 'snoozed' && (
                <Pressable
                  onPress={async () => {
                    hapticTrigger?.();
                    setSheet(null);
                    try {
                      await dispatch(
                        conversationActions.toggleConversationStatus({
                          conversationId,
                          payload: { status: 'open' },
                        }),
                      ).unwrap();
                      showToast({
                        message: isArabic ? 'تم إلغاء التأجيل وفتح المحادثة' : 'Conversation reopened',
                      });
                    } catch (e) {
                      showToast({ message: isArabic ? 'تعذر فتح المحادثة' : 'Failed to reopen' });
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#1B1C20' : 'rgba(44,165,74,0.15)',
                    borderWidth: 1.5,
                    borderColor: '#2CA54A',
                    marginBottom: 4,
                  }}>
                  <Text style={{ fontSize: 20 }}>✨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#6ee7b7' : '#047857', marginBottom: 2 }}>
                      {isArabic ? 'إلغاء التأجيل وفتح المحادثة' : 'Reopen Conversation (Un-snooze)'}
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#a7f3d0' : '#065f46' }}>
                      {isArabic ? 'إعادة المحادثة فوراً إلى صندوق المحادثات المفتوحة' : 'Move conversation back to open inbox immediately'}
                    </Text>
                  </View>
                </Pressable>
              )}
              {[
                {
                  id: 'next_reply',
                  label: isArabic ? 'حتى الرد التالي' : 'Until Next Reply',
                  desc: isArabic ? 'يتم إلغاء التأجيل بمجرد وصول رسالة من العميل' : 'Snooze until the customer responds',
                  icon: '💬',
                  snoozedUntil: null,
                },
                {
                  id: 'tomorrow',
                  label: isArabic ? 'غداً صباحاً (9:00 ص)' : 'Tomorrow Morning (9:00 AM)',
                  desc: isArabic ? 'تأجيل حتى صباح الغد' : 'Snooze until 9:00 AM tomorrow',
                  icon: '☀️',
                  getTimestamp: () => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(9, 0, 0, 0);
                    return Math.floor(d.getTime() / 1000);
                  },
                },
                {
                  id: '2_hours',
                  label: isArabic ? 'بعد ساعتين' : 'In 2 Hours',
                  desc: isArabic ? 'تأجيل لمدة ساعتين' : 'Snooze for 2 hours',
                  icon: '⏱️',
                  getTimestamp: () => Math.floor((Date.now() + 2 * 3600 * 1000) / 1000),
                },
                {
                  id: 'next_week',
                  label: isArabic ? 'الأسبوع القادم (الإثنين 9:00 ص)' : 'Next Week (Monday 9:00 AM)',
                  desc: isArabic ? 'تأجيل حتى بداية الأسبوع القادم' : 'Snooze until next Monday',
                  icon: '📅',
                  getTimestamp: () => {
                    const d = new Date();
                    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
                    d.setHours(9, 0, 0, 0);
                    return Math.floor(d.getTime() / 1000);
                  },
                },
              ].map(opt => (
                <Pressable
                  key={opt.id}
                  onPress={async () => {
                    hapticTrigger?.();
                    setSheet(null);
                    const snoozedUntil = 'getTimestamp' in opt && opt.getTimestamp ? opt.getTimestamp() : null;
                    try {
                      await dispatch(
                        conversationActions.toggleConversationStatus({
                          conversationId,
                          payload: {
                            status: 'snoozed',
                            snoozed_until: snoozedUntil,
                          },
                        }),
                      ).unwrap();
                      showToast({
                        message: isArabic ? `تم تأجيل المحادثة: ${opt.label}` : `Conversation snoozed: ${opt.label}`,
                      });
                    } catch (e) {
                      showToast({ message: isArabic ? 'تعذر تأجيل المحادثة' : 'Failed to snooze conversation' });
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#1B1C20' : '#EDEEF0',
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}>
                  <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimary, marginBottom: 2 }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: textSecondary }}>
                      {opt.desc}
                    </Text>
                  </View>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  const initialDate = new Date(Date.now() + 60 * 60 * 1000);
                  setCustomSnoozeDateText(initialDate.toISOString().slice(0, 10));
                  setCustomSnoozeTimeText(initialDate.toTimeString().slice(0, 5));
                  setCustomSnoozeOpen(true);
                }}
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: isDark ? '#1B1C20' : 'rgba(44,165,74,0.15)', borderWidth: 1, borderColor: '#725AFF' }}>
                <Text style={{ color: '#725AFF', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{isArabic ? 'اختيار تاريخ ووقت' : 'Pick Date & Time'}</Text>
              </Pressable>
              {customSnoozeOpen && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <TextInput
                    value={customSnoozeDateText}
                    onChangeText={setCustomSnoozeDateText}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
                    keyboardType="numbers-and-punctuation"
                    style={{ color: textPrimary, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center' }}
                  />
                  <TextInput
                    value={customSnoozeTimeText}
                    onChangeText={setCustomSnoozeTimeText}
                    placeholder="HH:MM"
                    placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
                    keyboardType="numbers-and-punctuation"
                    style={{ color: textPrimary, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center' }}
                  />
                  <Pressable onPress={handleCustomSnoozeSubmit} style={{ paddingVertical: 11, borderRadius: 8, backgroundColor: '#725AFF' }}>
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{isArabic ? 'تأكيد التأجيل' : 'Confirm Snooze'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </BottomSheet>
      )}

      {sheet === 'collaborators' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Collaborators</Text>
            <Pressable onPress={handleSaveCollaborators}><Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <TextInput
              value={collaboratorSearch}
              onChangeText={setCollaboratorSearch}
              placeholder="Search collaborators..."
              placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
          </View>
          <ScrollView style={{ maxHeight: 280 }}>
            {collaboratorAgents
              .filter(agent => !collaboratorSearch.trim() || (agent.name || agent.available_name || '').toLowerCase().includes(collaboratorSearch.toLowerCase()))
              .map(agent => {
                const isSelected = collaboratorIds.includes(agent.id);
                return (
                  <Pressable
                    key={agent.id}
                    onPress={() => setCollaboratorIds(ids => isSelected ? ids.filter(id => id !== agent.id) : [...ids, agent.id])}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {agent.thumbnail ? (
                        <Image source={{ uri: agent.thumbnail }} style={{ width: 32, height: 32, borderRadius: 999 }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#ffffff', fontWeight: '700' }}>{(agent.name || agent.available_name || 'A').charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>{agent.name || agent.available_name}</Text>
                    </View>
                    {isSelected && <Text style={{ color: '#725AFF', fontSize: 20, fontWeight: '700' }}>✓</Text>}
                  </Pressable>
                );
              })}
          </ScrollView>
          <View style={{ height: 8 }} />
        </BottomSheet>
      )}

      {sheet === 'shortcut' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary }}>Select Shortcut</Text>
            <Pressable onPress={() => setSheet(null)}><XIcon color={textPrimary} /></Pressable>
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <TextInput
              value={shortcutSearch}
              onChangeText={setShortcutSearch}
              placeholder="Search shortcuts..."
              placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {shortcutSearch ? (
              <Pressable onPress={() => setShortcutSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#626F7F'} />
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
                    <Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 13, marginBottom: 2 }}>/{cr.short_code}</Text>
                    <Text style={{ color: textPrimary, fontSize: 14 }} numberOfLines={2}>{cr.content}</Text>
                  </Pressable>
                ));
              }

              return (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                  <ShortcutIcon color={isDark ? '#94a3b8' : '#626F7F'} />
                  <Text style={{ color: '#80838D', fontWeight: '500' }}>
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
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Circle cx={11} cy={11} r={8} stroke="#725AFF" strokeWidth={2} /><Path d="m21 21-4.35-4.35" stroke="#725AFF" strokeWidth={2} strokeLinecap="round" /></Svg>
            <Text style={{ color: '#725AFF', fontSize: 14 }}>Search ongoing Workflows</Text>
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
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <TextInput
              value={labelSearch}
              onChangeText={setLabelSearch}
              placeholder="Search labels..."
              placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {labelSearch ? (
              <Pressable onPress={() => setLabelSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#626F7F'} />
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
                        <View style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: lbl.color || '#725AFF' }} />
                        <Text style={{ fontSize: 15, fontWeight: '500', color: textPrimary }}>{lbl.title}</Text>
                      </View>
                      {isSelected && (
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                });
              }

              return (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                  <Text style={{ color: '#80838D', fontWeight: '500' }}>
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
  const bgColor = isDark ? '#101113' : '#ffffff';
  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#1B1C20' : '#F0F0F3';
  const inputBg = isDark ? '#1B1C20' : '#ffffff';
  const inputBorder = isDark ? '#24262B' : '#EAEAEA';

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
        custom_attributes: {
          lifecycle_stage: stageName,
          lifecycle_stage_id: lifecycleStageId,
        },
      });
      if (conversation) {
        const currentSender = conversation.meta?.sender;
        const updatedSender = {
          ...currentSender,
          name: fullName || currentSender?.name,
          email: email.trim() || currentSender?.email,
          phoneNumber: phone.trim() || currentSender?.phoneNumber,
          lifecycle_stage_id: lifecycleStageId,
          customAttributes: {
            ...(currentSender?.customAttributes || {}),
            lifecycle_stage: stageName,
            lifecycle_stage_id: lifecycleStageId,
          },
        };
        dispatch(
          updateConversation({
            ...conversation,
            meta: {
              ...conversation.meta,
              sender: updatedSender,
            },
          }),
        );
      }
      showToast({ message: 'Contact updated successfully' });
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
      await dispatch(
        conversationActions.assignConversation({
          conversationId: conversation.id,
          assigneeId: agent.id,
        }),
      ).unwrap();
      setSelectedAssignee({ id: agent.id, name: agent.name || agent.available_name, thumbnail: agent.thumbnail });
      showToast({ message: `Assigned to ${agent.name || agent.available_name}` });
    } catch {
      showToast({ message: 'Failed to assign agent' });
    } finally {
      setSheet(null);
    }
  };

  const handleUnassign = async () => {
    try {
      await dispatch(
        conversationActions.assignConversation({
          conversationId: conversation.id,
          assigneeId: 0,
        }),
      ).unwrap();
      setSelectedAssignee(null);
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
      if (conversation) {
        dispatch(updateConversation({ ...conversation, labels: nextLabels }));
      }
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
            <ActivityIndicator size="small" color="#725AFF" />
          ) : (
            <Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 15 }}>Save</Text>
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
              placeholderTextColor="#80838D"
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
              placeholderTextColor="#80838D"
              style={inputCls}
            />
          </View>

          {/* Language */}
          <View>
            <Text style={labelCls}>Language</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500' }}>Add Language</Text>
              <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
            </View>
          </View>

          {/* Phone */}
          <View>
            <Text style={labelCls}>Phone</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputBorder, backgroundColor: inputBg, borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: inputBorder }}>
                <Text style={{ fontSize: 15 }}>🇪🇬</Text>
                <Text style={{ fontSize: 14, color: textSecondary, marginLeft: 2, fontWeight: '500' }}>+20</Text>
                <ChevronDown color={isDark ? '#94a3b8' : '#626F7F'} />
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor="#80838D"
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
                <XIcon color={isDark ? '#94a3b8' : '#80838D'} />
                <ChevronDown color={isDark ? '#94a3b8' : '#80838D'} />
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
              placeholderTextColor="#80838D"
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
                    <XIcon color={isDark ? '#94a3b8' : '#80838D'} />
                  </Pressable>
                ) : null}
                <ChevronDown color={isDark ? '#94a3b8' : '#80838D'} />
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
                <ChevronDown color={isDark ? '#94a3b8' : '#80838D'} />
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
                      const badgeColor = lblObj?.color || '#725AFF';
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
                          <Text style={{ color: isDark ? '#ffffff' : (badgeColor === '#ffffff' ? '#282E34' : badgeColor), fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                            {lbl}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  <ChevronDown color={isDark ? '#94a3b8' : '#80838D'} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500' }}>Add Tags</Text>
                  <ChevronDown color={isDark ? '#94a3b8' : '#80838D'} />
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

          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <TextInput
              value={assignSearch}
              onChangeText={setAssignSearch}
              placeholder="Search agent..."
              placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {assignSearch ? (
              <Pressable onPress={() => setAssignSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#626F7F'} />
              </Pressable>
            ) : null}
          </View>

          {/* Unassign option */}
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}
            onPress={handleUnassign}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: isDark ? '#24262B' : '#EAEAEA', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: textSecondary, fontWeight: '600', fontSize: 13 }}>✕</Text>
              </View>
              <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>Unassigned</Text>
            </View>
            {!selectedAssignee?.name && (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
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
                        <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{(ag.name || 'A').charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={{ color: textPrimary, fontWeight: '500', fontSize: 14 }}>{ag.name || ag.available_name}</Text>
                    </View>
                    {isSelected && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
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
            <Pressable onPress={() => setSheet(null)}><Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
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
            <Pressable onPress={() => setSheet(null)}><Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Done</Text></Pressable>
          </View>

          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <SearchIcon color={isDark ? '#94a3b8' : '#626F7F'} />
            <TextInput
              value={labelSearch}
              onChangeText={setLabelSearch}
              placeholder="Search tags..."
              placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
              style={{ flex: 1, color: textPrimary, fontSize: 14, paddingVertical: 6 }}
            />
            {labelSearch ? (
              <Pressable onPress={() => setLabelSearch('')}>
                <XIcon color={isDark ? '#94a3b8' : '#626F7F'} />
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
                        <View style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: lbl.color || '#725AFF' }} />
                        <Text style={{ fontSize: 15, fontWeight: '500', color: textPrimary }}>{lbl.title}</Text>
                      </View>
                      {isSelected && (
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M5 13l4 4L19 7" stroke="#725AFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                });
              }

              return (
                <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                  <Text style={{ color: '#80838D', fontWeight: '500' }}>
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
  const [showAddContact, setShowAddContact] = useState(false);
  const allConversations = useAppSelector(selectAllConversations);
  const conversationsLoading = useAppSelector(selectConversationsLoading);
  const isAllConversationsFetched = useAppSelector(selectIsAllConversationsFetched);
  const conversationLoadError = useAppSelector(selectConversationLoadError);
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
  const [actionConversation, setActionConversation] = useState<Conversation | null>(null);
  const [snoozeConversation, setSnoozeConversation] = useState<Conversation | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [customPickerMode, setCustomPickerMode] = useState(false);
  const [customDateText, setCustomDateText] = useState('');
  const [customTimeText, setCustomTimeText] = useState('');

  const pageRef = React.useRef(1);
  const isLoadingPageRef = React.useRef(false);
  const fetchIdRef = React.useRef(0);
  const [isFlashListReady, setFlashListReady] = useState(false);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
  const [searchTab, setSearchTab] = useState<'contacts' | 'messages' | 'comments'>('messages');
  const openedRowIndex = useSharedValue<number | null>(null);

  const fetchConversationsFromApi = React.useCallback(
    async (pageNumber = 1, fetchId?: number) => {
      let assigneeType: 'all' | 'me' | 'unassigned' = 'all';
      let targetInboxId = 0;

      if (activeItem === 'mine') assigneeType = 'me';
      if (activeItem === 'unassigned') assigneeType = 'unassigned';
      if (activeItem.startsWith('inbox_')) {
        targetInboxId = Number(activeItem.replace('inbox_', ''));
      }

      const apiStatus = tab === 'all' ? 'all' : tab === 'closed' ? 'resolved' : tab;

      const result = await dispatch(
        conversationActions.fetchConversations({
          status: apiStatus,
          assigneeType,
          inboxId: targetInboxId,
          page: pageNumber,
          sortBy: 'latest',
        } as any),
      );

      if (fetchId !== undefined && fetchIdRef.current !== fetchId) return undefined;

      return (result as any).payload as ConversationListResponse;
    },
    [dispatch, tab, activeItem],
  );

  React.useEffect(() => {
    pageRef.current = 1;
    isLoadingPageRef.current = false;
    setFlashListReady(false);
    const fetchId = ++fetchIdRef.current;
    fetchConversationsFromApi(1, fetchId).then(data => {
      if (fetchIdRef.current !== fetchId) return;
      if (data && data.conversations && Array.isArray(data.conversations)) {
        if (data.conversations.length === 0) {
          pageRef.current = 1;
        } else {
          pageRef.current = 1;
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
          const normalized = res.payload.map((c: any) => ({
            ...transformConversation(c),
            id: c.id,
            inboxId: c.inbox?.id,
            inbox_id: c.inbox?.id,
            meta: {
              sender: {
                id: c.contact?.id,
                name: c.contact?.name,
                available_name: c.contact?.name,
                thumbnail: c.contact?.thumbnail || null,
                avatar_url: c.contact?.avatar_url || null,
                customAttributes: c.contact?.customAttributes || {},
                custom_attributes: c.contact?.custom_attributes || {},
              },
              channel: c.inbox?.channel_type || c.inbox?.channelType,
              assignee: c?.meta?.assignee || null,
              team: c?.meta?.team || null,
            },
            lastNonActivityMessage:
              c.lastNonActivityMessage ||
              (c.messages?.length
                ? { content: c.messages[c.messages.length - 1].content, created_at: c.messages[c.messages.length - 1].created_at }
                : null),
            labels: c.labels || [],
            unreadCount: c.unreadCount ?? c.unread_count ?? 0,
            status: c.status || 'open',
          }));
          setServerSearchResults(normalized as unknown as Conversation[]);
        }
      } catch {
        // Search failure is non-critical
      } finally {
        setIsSearchingServer(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    pageRef.current = 1;
    isLoadingPageRef.current = false;
    const fetchId = ++fetchIdRef.current;
    dispatch(clearAllConversations());
    fetchConversationsFromApi(1, fetchId).finally(() => {
      if (fetchIdRef.current === fetchId) {
        setRefreshing(false);
      }
    });
  }, [dispatch, fetchConversationsFromApi]);

  const handleLoadMore = React.useCallback(async () => {
    if (isLoadingPageRef.current || isAllConversationsFetched) return;
    isLoadingPageRef.current = true;
    const nextPage = pageRef.current + 1;
    const fetchId = fetchIdRef.current;
    try {
      const data = await fetchConversationsFromApi(nextPage, fetchId);
      if (fetchIdRef.current !== fetchId) return;
      if (data && data.conversations && Array.isArray(data.conversations)) {
        if (data.conversations.length > 0) {
          pageRef.current = nextPage;
        }
      }
    } catch {
      // Pagination failure is non-critical
    } finally {
      if (fetchIdRef.current === fetchId) {
        isLoadingPageRef.current = false;
      }
    }
  }, [fetchConversationsFromApi, isAllConversationsFetched]);

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
      if (activeItem.startsWith('stage_')) {
        const stageId = activeItem.replace('stage_', '');
        const selectedStage = apiLifecycleStages.find(stage => String(stage.id) === stageId);
        const senderStage = (item.meta?.sender as any)?.lifecycleStage ?? (item.meta?.sender as any)?.lifecycle_stage;
        const senderStageId = senderStage?.id ?? (item.meta?.sender as any)?.lifecycleStageId ?? (item.meta?.sender as any)?.lifecycle_stage_id;
        return (
          String(senderStageId ?? '') === stageId ||
          Boolean(selectedStage && senderStage?.name?.toLowerCase() === selectedStage.name.toLowerCase())
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const aTime = Number(getConversationTimestamp(a)) || 0;
      const bTime = Number(getConversationTimestamp(b)) || 0;
      return sortBy === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [allConversations, tab, activeItem, userId, sortBy, apiLifecycleStages]);

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
    const allResults = [...localFiltered, ...uniqueServer];

    // Tab-based filtering (API returns conversations only; tabs refine client-side)
    if (searchTab === 'contacts') {
      return allResults.filter(c => {
        const s = c.meta?.sender;
        const name = (s?.name || '').toLowerCase();
        const email = (s?.email || '').toLowerCase();
        const phone = (s?.phoneNumber || (s as any)?.phone_number || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    if (searchTab === 'comments') {
      return allResults.filter(c =>
        (c.messages || []).some(m =>
          (m.private === true || (m as any).is_private === true) &&
          (m.content || '').toLowerCase().includes(q),
        ),
      );
    }
    // messages (default): all matched conversations
    return allResults;
  }, [conversations, searchQuery, serverSearchResults, searchTab]);

  const { isDark } = useTheme();
  const bgColor = isDark ? '#101113' : '#ffffff';
  const textPrimary = isDark ? '#EDEEF0' : '#282E34';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#1B1C20' : '#F0F0F3';
  const inputBg = isDark ? '#1B1C20' : '#F0F0F3';

  const openConversationAction = (action: string) => {
    if (!actionConversation) return;
    const conversationId = actionConversation.id;
    setActionConversation(null);
    (navigation as any).navigate('ChatScreen', action === 'contact'
      ? { conversationId, openContact: true }
      : { conversationId, openSheet: action });
  };

  const handleCustomSnoozeSubmit = async () => {
    if (!snoozeConversation) return;
    const next = new Date(`${customDateText}T${customTimeText}:00`);
    if (Number.isNaN(next.getTime()) || next.getTime() <= Date.now()) {
      showToast({ message: isArabic ? 'اختر تاريخًا ووقتًا صحيحين في المستقبل' : 'Choose a valid future date and time' });
      return;
    }
    try {
      await dispatch(conversationActions.toggleConversationStatus({
        conversationId: snoozeConversation.id,
        payload: { status: 'snoozed', snoozed_until: Math.floor(next.getTime() / 1000) },
      })).unwrap();
      setSnoozeConversation(null);
    } catch {
      showToast({ message: isArabic ? 'تعذر تأجيل المحادثة' : 'Failed to snooze conversation' });
    } finally {
      setCustomPickerMode(false);
    }
  };

  const renderConversationItem = ({ item, index }: { item: Conversation; index: number }) => {
    const cname = getContactName(item.meta?.sender);
    const clastMsg = item.lastNonActivityMessage?.content || (item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.content : null) || (isArabic ? 'لا يوجد محتوى' : 'No message content');
    const cassignee = item.meta?.assignee;
    const cassigneeInitial = cassignee?.name ? cassignee.name.charAt(0).toUpperCase() : 'A';
    const ctime = formatChatTime(getConversationTimestamp(item), isArabic);
    const isTyping = Boolean(typingRecords && typingRecords[item.id] && typingRecords[item.id].length > 0);
    const inbox = inboxesMap[item.inboxId] || inboxesMap[(item as any).inbox_id];
    const senderData = item.meta?.sender as any;
    const isWhatsAppConversation = Object.keys({
      ...(senderData?.customAttributes || {}),
      ...(senderData?.custom_attributes || {}),
    }).some(key => key.toLowerCase().includes('whatsapp'));
    const channelIcon = getChannelIcon(
      inbox?.channelType || item.meta?.channel || '',
      inbox?.medium || (isWhatsAppConversation ? 'whatsapp' : ''),
      '',
    );

    // 1. Lifecycle Stage
    const lifecycleStageFromApi = senderData?.lifecycleStage ?? senderData?.lifecycle_stage;
    const caStage =
      (lifecycleStageFromApi?.name ?? lifecycleStageFromApi?.id) ||
      item.customAttributes?.lifecycle_stage ||
      item.customAttributes?.stage ||
      (item as any).custom_attributes?.lifecycle_stage ||
      (item as any).custom_attributes?.stage ||
      (item.additionalAttributes as any)?.lifecycle_stage ||
      item.meta?.sender?.customAttributes?.lifecycle_stage ||
      (item.meta?.sender as any)?.custom_attributes?.lifecycle_stage;

    let stageName = 'New Lead';
    let stageEmoji = '🌱';

    if (lifecycleStageFromApi?.name) {
      stageName = lifecycleStageFromApi.name;
      stageEmoji = lifecycleStageFromApi.icon || '🌱';
    } else if (caStage) {
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

    const handleSwipeSnooze = () => setSnoozeConversation(item);

    const handleSwipeClose = async () => {
      try {
        await dispatch(conversationActions.toggleConversationStatus({
          conversationId: item.id,
          payload: { status: 'resolved' },
        })).unwrap();
        showToast({ message: isArabic ? 'تم إغلاق المحادثة' : 'Conversation closed' });
      } catch {
        showToast({ message: isArabic ? 'تعذر إغلاق المحادثة' : 'Failed to close conversation' });
      }
    };

    return (
      <Swipeable
        key={String(item.id)}
        index={index}
        openedRowIndex={openedRowIndex}
        spacing={8}
        leftElement={(
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <SnoozeIcon color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Snooze</Text>
          </View>
        )}
        rightElement={(
          <View style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
            <Pressable
              onPress={event => {
                event.stopPropagation();
                setActionConversation(item);
              }}
              style={{ width: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#202020' }}>
              <MoreIcon color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>More</Text>
            </Pressable>
            <View style={{ width: 44, alignItems: 'center', justifyContent: 'center' }}>
              <ResolveIcon color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Close</Text>
            </View>
          </View>
        )}
        handleLeftElementPress={handleSwipeSnooze}
        handleOnLeftOverswiped={handleSwipeSnooze}
        handleRightElementPress={handleSwipeClose}
        handlePress={() => (navigation as any).navigate('ChatScreen', { conversationId: Number(item.id) })}
        triggerOverswipeOnFlick
        leftElementBgColor="bg-orange-600"
        rightElementBgColor="bg-green-800">
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
                <View style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: 'rgba(250,137,0,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FA8900' }}>
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
                <Text style={{ color: '#2CA54A', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {item.status === 'snoozed' && (
                <View style={{ marginRight: 2 }}>
                  <SnoozeIcon color="#725AFF" />
                </View>
              )}
              <Text style={{ color: textSecondary, fontSize: 12 }}>{ctime}</Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={{ backgroundColor: '#2CA54A', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer row with Lifecycle Stage & Labels */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingLeft: 54 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, paddingRight: 8 }}>
            {/* Lifecycle Stage Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, backgroundColor: isDark ? '#1B1C20' : '#F0F0F3', borderWidth: 1, borderColor: isDark ? '#24262B' : '#EAEAEA', borderRadius: 6, paddingHorizontal: 7 }}>
              <Text style={{ fontSize: 11 }}>{stageEmoji}</Text>
              <Text style={{ color: textPrimary, fontSize: 11, fontWeight: '600' }}>{stageName}</Text>
            </View>

            {/* Labels Badges */}
            {convLabels.slice(0, 2).map((lbl, lIdx) => {
              const lblObj = apiLabels.find(al => (al.title || '').toLowerCase() === String(lbl).toLowerCase());
              const dotColor = lblObj?.color || '#725AFF';
              return (
                <View
                  key={lIdx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    height: 18,
                    backgroundColor: isDark ? dotColor + '28' : dotColor + '18',
                    borderWidth: 1,
                    borderColor: isDark ? dotColor + '60' : dotColor + '40',
                    borderRadius: 5,
                    paddingHorizontal: 5,
                  }}>
                  <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: dotColor }} />
                  <Text style={{ color: isDark ? '#ffffff' : dotColor, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
                    {lbl}
                  </Text>
                </View>
              );
            })}
            {convLabels.length > 2 && (
              <View style={{ backgroundColor: isDark ? '#24262B' : '#EAEAEA', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: textSecondary }}>+{convLabels.length - 2}</Text>
              </View>
            )}
          </View>

          {/* Assignee */}
          {cassignee && (
            cassignee.thumbnail ? (
              <Image source={{ uri: cassignee.thumbnail }} style={{ width: 26, height: 26, borderRadius: 999 }} />
            ) : (
              <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: '#725AFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{cassigneeInitial}</Text>
              </View>
            )
          )}
        </View>
      </Pressable>
      </Swipeable>
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
              placeholderTextColor="#80838D"
              style={{ flex: 1, color: textPrimary, fontSize: 14, textAlign: isArabic ? 'right' : 'left' }}
            />
            {isSearchingServer ? (
              <ActivityIndicator size="small" color="#725AFF" />
            ) : searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <XIcon />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); setServerSearchResults([]); }}>
            <Text style={{ color: '#725AFF', fontWeight: '500', fontSize: 14 }}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {(['contacts', 'messages', 'comments'] as const).map((t) => {
            const active = searchTab === t;
            const label = t === 'contacts' ? (isArabic ? 'جهات' : 'Contacts') : t === 'messages' ? (isArabic ? 'رسائل' : 'Messages') : (isArabic ? 'تعليقات' : 'Comments');
            return (
              <Pressable
                key={t}
                onPress={() => setSearchTab(t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? (isDark ? '#EDEEF0' : '#282E34') : inputBg,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? (isDark ? '#101113' : '#ffffff') : textSecondary }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {filteredConversations.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Text style={{ color: textSecondary, fontSize: 14 }}>
                {isArabic ? 'لا توجد نتائج مطابقة' : 'No matching results'}
              </Text>
            </View>
          ) : (
            filteredConversations.map((item, index) => renderConversationItem({ item, index }))
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}><HamburgerIcon color={textPrimary} /></Pressable>
            <Text style={{ fontSize: 20, fontWeight: '600', color: textPrimary }}>{activeLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setShowSearch(true)} hitSlop={8}><SearchIcon color={textPrimary} /></Pressable>
            <Pressable onPress={() => setShowAddContact(true)} hitSlop={8}><View style={{ width: 22, height: 22 }}><UserCircleIcon color={textPrimary} /></View></Pressable>
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
            <ActivityIndicator size="small" color="#725AFF" />
          </View>
        ) : !conversationsLoading && conversationLoadError && filteredConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: isDark ? '#FF382E' : '#FF382E', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
              {conversationLoadError || (isArabic ? 'فشل تحميل المحادثات' : 'Failed to load conversations')}
            </Text>
            <Pressable
              onPress={() => {
                pageRef.current = 1;
                isLoadingPageRef.current = false;
                const fetchId = ++fetchIdRef.current;
                fetchConversationsFromApi(1, fetchId);
              }}
              style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: isDark ? '#725AFF' : '#282E34' }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>{isArabic ? 'إعادة المحاولة' : 'Retry'}</Text>
            </Pressable>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 64 }}>
            <ChatBubbleIcon />
            <Text style={{ color: textPrimary, fontWeight: '600' }}>
              {isArabic ? 'لا توجد محادثات لعرضها' : 'No conversations to show'}
            </Text>
          </View>
        ) : (
          <FlashList
            data={filteredConversations}
            renderItem={renderConversationItem}
            estimatedItemSize={91}
            keyExtractor={item => String(item.id)}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{ paddingBottom: 80 }}
            style={{ flex: 1 }}
            onScrollBeginDrag={() => {
              if (!isFlashListReady) {
                setFlashListReady(true);
              }
            }}
          />
        )}

        {/* Drawer overlay */}
        {drawerOpen && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 40, flexDirection: 'row' }} onStartShouldSetResponder={() => true} onResponderRelease={() => setDrawerOpen(false)}>
            <View style={{ height: '100%', backgroundColor: bgColor, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, width: '83%' }} onStartShouldSetResponder={() => true}>
              <InboxDrawer
                activeItem={activeItem}
                onSelect={(key, label) => { setActiveItem(key); setActiveLabel(label); }}
                onClose={() => setDrawerOpen(false)}
                 isDark={isDark}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          </View>
        )}

        {actionConversation && (
          <BottomSheet onClose={() => setActionConversation(null)}>
            {[
              {
                icon: <ResolveIcon color={textPrimary} />,
                label: isArabic ? 'إغلاق المحادثة' : 'Close Conversation',
                onPress: async () => {
                  await dispatch(conversationActions.toggleConversationStatus({
                    conversationId: actionConversation.id,
                    payload: { status: 'resolved' },
                  }));
                  setActionConversation(null);
                },
              },
              { icon: <LifecycleIcon color={textPrimary} />, label: isArabic ? 'اختيار مرحلة العميل' : 'Select Lifecycle Stage', onPress: () => openConversationAction('stage') },
              { icon: <UserCircleIcon color={textPrimary} />, label: isArabic ? 'تعيين مستخدم' : 'Assign User', onPress: () => openConversationAction('assign') },
              { icon: <TeamIcon color={textPrimary} />, label: isArabic ? 'المتعاونون' : 'Collaborators', onPress: () => openConversationAction('collaborators') },
              { icon: <ShortcutIcon color={textPrimary} />, label: isArabic ? 'اختيار اختصار' : 'Select Shortcut', onPress: () => openConversationAction('shortcut') },
              {
                icon: <SnoozeIcon color={textPrimary} />,
                label: isArabic ? 'تأجيل المحادثة' : 'Snooze Conversation',
                onPress: () => { setSnoozeConversation(actionConversation); setActionConversation(null); },
              },
              { icon: <UserCircleIcon color={textPrimary} />, label: isArabic ? 'عرض تفاصيل العميل' : 'View Contact Details', onPress: () => openConversationAction('contact') },
            ].map((action, index, actions) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: index === actions.length - 1 ? 0 : 1, borderBottomColor: borderColor }}>
                {action.icon}
                <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '500' }}>{action.label}</Text>
              </Pressable>
            ))}
          </BottomSheet>
        )}

        {snoozeConversation && (
          <BottomSheet
            onClose={() => setSnoozeConversation(null)}
            bottomOffset={customPickerMode ? keyboardHeight : 0}>
            <Text style={{ color: textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
              {isArabic ? 'تأجيل المحادثة' : 'Snooze Conversation'}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 24, paddingBottom: 12 }}>
              {isArabic ? 'اختر موعد إعادة فتح المحادثة' : 'Choose when to reopen this conversation'}
            </Text>
            {[
              { label: isArabic ? 'عند الرد القادم' : 'Until Next Reply', timestamp: null },
              { label: isArabic ? 'بعد ساعتين' : 'In 2 Hours', timestamp: Date.now() + 2 * 60 * 60 * 1000 },
              { label: isArabic ? 'غدًا صباحًا' : 'Tomorrow Morning', timestamp: (() => { const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(9, 0, 0, 0); return date.getTime(); })() },
              { label: isArabic ? 'الأسبوع القادم' : 'Next Week', timestamp: (() => { const date = new Date(); date.setDate(date.getDate() + ((1 + 7 - date.getDay()) % 7 || 7)); date.setHours(9, 0, 0, 0); return date.getTime(); })() },
            ].map(option => (
              <Pressable
                key={option.label}
                onPress={async () => {
                  try {
                    await dispatch(conversationActions.toggleConversationStatus({
                      conversationId: snoozeConversation.id,
                      payload: { status: 'snoozed', snoozed_until: option.timestamp ? Math.floor(option.timestamp / 1000) : null },
                    })).unwrap();
                    setSnoozeConversation(null);
                  } catch {
                    showToast({ message: isArabic ? 'تعذر تأجيل المحادثة' : 'Failed to snooze conversation' });
                  }
                }}
                style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderColor }}>
                <Text style={{ color: '#725AFF', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{option.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                const tomorrow = new Date(Date.now() + 60 * 60 * 1000);
                setCustomDateText(tomorrow.toISOString().slice(0, 10));
                setCustomTimeText(tomorrow.toTimeString().slice(0, 5));
                setCustomPickerMode(true);
              }}
              style={{ marginHorizontal: 20, marginTop: 4, marginBottom: 8, paddingVertical: 12, borderRadius: 8, backgroundColor: isDark ? '#1B1C20' : 'rgba(44,165,74,0.15)', borderWidth: 1, borderColor: '#725AFF' }}>
              <Text style={{ color: '#725AFF', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{isArabic ? 'اختيار تاريخ ووقت' : 'Pick Date & Time'}</Text>
            </Pressable>
            {customPickerMode && (
              <View style={{ marginHorizontal: 20, marginBottom: 8, gap: 8 }}>
                <TextInput
                  value={customDateText}
                  onChangeText={setCustomDateText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
                  keyboardType="numbers-and-punctuation"
                  style={{ color: textPrimary, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center' }}
                />
                <TextInput
                  value={customTimeText}
                  onChangeText={setCustomTimeText}
                  placeholder="HH:MM"
                  placeholderTextColor={isDark ? '#94a3b8' : '#80838D'}
                  keyboardType="numbers-and-punctuation"
                  style={{ color: textPrimary, backgroundColor: isDark ? '#24262B' : '#F0F0F3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center' }}
                />
                <Pressable onPress={handleCustomSnoozeSubmit} style={{ paddingVertical: 11, borderRadius: 8, backgroundColor: '#725AFF' }}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{isArabic ? 'تأكيد التأجيل' : 'Confirm Snooze'}</Text>
                </Pressable>
              </View>
            )}
            <Pressable onPress={() => setSnoozeConversation(null)} style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
              <Text style={{ color: textSecondary, fontSize: 13, textAlign: 'center' }}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
            </Pressable>
          </BottomSheet>
        )}

        {/* Sort Bottom Sheet */}
        {showSort && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setShowSort(false)}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: isDark ? '#1B1C20' : 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#31343A' : '#EAEAEA', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
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
                    <Text style={{ color: '#725AFF', fontSize: 16, fontWeight: '700' }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
      {showAddContact && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <AddContactScreen onBack={() => setShowAddContact(false)} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default InboxScreenDesign;
