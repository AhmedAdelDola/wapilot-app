import React, { useState } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
  ScrollView,
  Animated,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { conversationActions } from '@/store/conversation/conversationActions';
import {
  selectAllConversations,
  selectConversationsLoading,
  selectConversationById,
  getMessagesByConversationId,
} from '@/store/conversation/conversationSelectors';
import { selectUserId } from '@/store/auth/authSelectors';
import { selectAllInboxes } from '@/store/inbox/inboxSelectors';
import { ConversationService } from '@/store/conversation/conversationService';
import type { Conversation } from '@/types/Conversation';
import type { Message } from '@/types';
import { MESSAGE_TYPES } from '@/constants';

// ---------- Icons ----------
const HamburgerIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M3 12h18M3 18h18" stroke="#374151" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke="#6b7280" strokeWidth={2} />
    <Path d="m21 21-4.35-4.35" stroke="#6b7280" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const UserCircleIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#374151" strokeWidth={1.8} />
    <Circle cx={12} cy={10} r={3.2} stroke="#374151" strokeWidth={1.8} />
    <Path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#374151" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const FilterIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M7 12h10M11 18h2" stroke="#374151" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const XIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#111827" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const ChevronDown = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ArrowLeft = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChatBubbleIcon = () => (
  <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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
const WorkflowIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={7} height={7} rx={1} stroke="#6b7280" strokeWidth={1.8} />
    <Rect x={14} y={3} width={7} height={7} rx={1} stroke="#6b7280" strokeWidth={1.8} />
    <Rect x={3} y={14} width={7} height={7} rx={1} stroke="#6b7280" strokeWidth={1.8} />
    <Path d="M14 17.5h7M17.5 14v7" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const ShortcutIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BlockSlash = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#6b7280" strokeWidth={1.8} />
    <Path d="M4.93 4.93l14.14 14.14" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const SendIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#d1d5db" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChatBlue = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#3b82f6" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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
const AtIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={4} stroke="#6b7280" strokeWidth={1.8} />
    <Path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const UsersIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={7} r={4} stroke="#6b7280" strokeWidth={1.8} />
    <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const LifecycleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const TeamIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={9} cy={7} r={4} stroke="currentColor" strokeWidth={1.8} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const InboxDrawerIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth={1.8} />
    <Path d="M3 12h4l2 3h6l2-3h4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const MineIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={18} height={18} rx={4} stroke="currentColor" strokeWidth={1.8} />
    <Circle cx={12} cy={10} r={3} stroke="currentColor" strokeWidth={1.5} />
    <Path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const UnassignedIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={8} r={3} stroke="currentColor" strokeWidth={1.8} />
    <Path d="M3 20c0-3.3 2.7-6 6-6m6-1v6m-3-3h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

// ---------- FilterChip ----------
const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Pressable
    onPress={onClick}
    style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: active ? '#111827' : '#f3f4f6',
    }}>
    <Text style={{ fontSize: 14, fontWeight: '500', color: active ? 'white' : '#374151' }}>{label}</Text>
  </Pressable>
);

// ---------- Sheet wrapper (bottom) ----------
const BottomSheet = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={onClose}>
    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
      <View style={{ width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />
      {children}
    </View>
  </View>
);

const ChatBubbleIcon2 = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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
  const [teamOpen, setTeamOpen] = useState(true);
  const [custoOpen, setCustoOpen] = useState(true);

  // Realtime counts derived from the store (ActionCable updates conversations → counts update live)
  const mineCount = conversations.filter(c => c.meta?.assignee?.id === userId).length;
  const unassignedCount = conversations.filter(c => !c.meta?.assignee).length;
  const lifecycleCounts: Record<string, number> = {};
  conversations.forEach(c => {
    const label = c.labels?.[0];
    if (label) lifecycleCounts[label] = (lifecycleCounts[label] || 0) + 1;
  });

  const mainItems = [
    { key: 'all', label: 'All', icon: <InboxDrawerIcon />, count: conversations.length },
    { key: 'mine', label: 'Mine', icon: <MineIcon />, count: mineCount },
    { key: 'unassigned', label: 'Unassigned', icon: <UnassignedIcon />, count: unassignedCount },
  ];
  const lifecycle = [
    { key: 'newlead', label: 'New Lead', emoji: '🆕', count: lifecycleCounts['new'] || 0 },
    { key: 'hotlead', label: 'Hot Lead', emoji: '🔥', count: lifecycleCounts['hot'] || 0 },
    { key: 'payment', label: 'Payment', emoji: '💵', count: lifecycleCounts['payment'] || 0 },
    { key: 'customer', label: 'Customer', emoji: '😍', count: lifecycleCounts['customer'] || 0 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Inbox</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <UserCircleIcon />
          <FilterIcon />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingBottom: 16 }}>
        {mainItems.map(({ key, label, icon }) => {
          const isActive = activeItem === key;
          return (
            <Pressable key={key} onPress={() => { onSelect(key, label); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: isActive ? 12 : 16, backgroundColor: isActive ? '#eff6ff' : 'transparent', marginHorizontal: isActive ? 12 : 0, borderRadius: isActive ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {icon}
                <Text style={{ fontWeight: '500', color: isActive ? '#2563eb' : '#374151' }}>{label}</Text>
              </View>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>0</Text>
            </Pressable>
          );
        })}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: '#f3f4f6' }} />

        {/* Lifecycle */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setLifecycleOpen(!lifecycleOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LifecycleIcon />
            <Text style={{ fontWeight: '600', color: '#111827' }}>Lifecycl</Text>
          </View>
          <ChevronDown />
        </Pressable>
        {lifecycleOpen && lifecycle.map(({ key, label, emoji }) => (
          <Pressable key={key} onPress={() => { onSelect(key, label); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 18, width: 20, textAlign: 'center' }}>{emoji}</Text>
              <Text style={{ color: '#374151' }}>{label}</Text>
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>0</Text>
          </Pressable>
        ))}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: '#f3f4f6' }} />

        {/* Tea */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setTeamOpen(!teamOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TeamIcon />
            <Text style={{ fontWeight: '600', color: '#111827' }}>Tea</Text>
          </View>
          <ChevronDown />
        </Pressable>
        {teamOpen && <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No inboxes available</Text>}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: '#f3f4f6' }} />

        {/* Custo */}
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setCustoOpen(!custoOpen)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ChatBubbleIcon2 />
            <Text style={{ fontWeight: '600', color: '#111827' }}>Custo</Text>
          </View>
          <ChevronDown />
        </Pressable>
        {custoOpen && <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No inboxes available</Text>}
      </ScrollView>
    </View>
  );
};

// ---------- Chat Screen (ConversationDetailScreen) ----------
const ChatScreenDesign = ({ conversationId, onBack }: { conversationId: number; onBack: () => void }) => {
  const dispatch = useAppDispatch();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const messages = useAppSelector(state => getMessagesByConversationId(state, { conversationId }));
  const [sheet, setSheet] = useState<null | 'menu' | 'assign' | 'stage' | 'snooze' | 'shortcut' | 'workflow'>(null);
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState(conversation?.labels?.[0] === 'hot' ? 'Hot Lead' : conversation?.labels?.[0] === 'payment' ? 'Payment' : conversation?.labels?.[0] === 'customer' ? 'Customer' : conversation?.labels?.[0] === 'cold' ? 'Cold Lead' : 'New Lead');
  const [stageEmoji, setStageEmoji] = useState(conversation?.labels?.[0] === 'hot' ? '🔥' : conversation?.labels?.[0] === 'payment' ? '💵' : conversation?.labels?.[0] === 'customer' ? '😍' : conversation?.labels?.[0] === 'cold' ? '🧊' : '🆕');
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [assignee, setAssignee] = useState<'me' | 'unassigned'>('me');

  const name = conversation?.meta?.sender?.name || conversation?.meta?.sender?.email || 'Unknown';
  const lastMsg = messages.length ? messages[messages.length - 1]?.content : (conversation && 'lastNonActivityMessage' in conversation ? conversation.lastNonActivityMessage?.content : '');

  React.useEffect(() => {
    dispatch(conversationActions.fetchConversation(conversationId));
    dispatch(conversationActions.fetchPreviousMessages({ conversationId, beforeId: null } as any));
    dispatch(conversationActions.markMessageRead({ conversationId }) as any);
  }, [conversationId]);

  const lifecycleStages = [
    { emoji: '🆕', label: 'New Lead' },
    { emoji: '🔥', label: 'Hot Lead' },
    { emoji: '💵', label: 'Payment' },
    { emoji: '😍', label: 'Customer' },
  ];

  if (showContactDetails) {
    return <ContactDetailsScreen conversation={conversation as Conversation} onBack={() => setShowContactDetails(false)} />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header row 1 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={onBack} hitSlop={8}><ArrowLeft /></Pressable>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => setShowContactDetails(true)}>
              <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: '#d97706', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>😊</Text>
              </View>
              <Text style={{ fontWeight: '600', color: '#111827', fontSize: 16 }}>{name}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pressable hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 }}>
              <PhoneIcon />
              <ChevronDown />
            </Pressable>
            <Pressable hitSlop={8} style={{ padding: 4 }}><ResolveIcon /></Pressable>
            <Pressable hitSlop={8} style={{ padding: 4 }} onPress={() => setSheet('menu')}><MoreIcon /></Pressable>
          </View>
        </View>

        {/* Header row 2 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setSheet('assign')}>
            <View style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>A</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#374151' }}>Ahmed Adel</Text>
            <ChevronDown />
          </Pressable>

          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 'auto' }} onPress={() => setSheet('stage')}>
            <Text style={{ fontSize: 14 }}>{stageEmoji}</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>{stage}</Text>
            <ChevronDown />
          </Pressable>

          <Pressable hitSlop={8} style={{ marginLeft: 4, padding: 4 }} onPress={() => setSheet('snooze')}><SnoozeIcon /></Pressable>
        </View>

        {/* Chat area */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>Today</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4, marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              Contact <Text style={{ fontWeight: '600', color: '#374151' }}>{name}</Text> added by <Text style={{ fontWeight: '600', color: '#374151' }}>you</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={12} r={10} stroke="#9ca3af" strokeWidth={1.5} /><Path d="M12 6v6l3 3" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" /></Svg>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Conversation opened by <Text style={{ fontWeight: '600', color: '#374151' }}>you</Text></Text>
            </View>
          </View>
          {messages.map((m, idx) => {
            const isOutgoing = m.messageType === MESSAGE_TYPES.OUTGOING || (m as any).sender?.type === 'user';
            const time = m.createdAt ? new Date(m.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <View key={m.id ?? idx} style={{ flexDirection: 'row', justifyContent: isOutgoing ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginTop: 12 }}>
                {!isOutgoing && (
                  <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14 }}>😊</Text>
                  </View>
                )}
                <View style={{ backgroundColor: isOutgoing ? '#fffbeb' : '#f3f4f6', borderWidth: 1, borderColor: isOutgoing ? '#fef3c7' : '#e5e7eb', borderRadius: 16, borderBottomRightRadius: isOutgoing ? 4 : 16, borderBottomLeftRadius: isOutgoing ? 16 : 4, paddingHorizontal: 16, paddingVertical: 10, maxWidth: '72%' }}>
                  <Text style={{ color: '#1f2937', fontSize: 14 }}>{m.content}</Text>
                  {time ? <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'right', marginTop: 2 }}>{time}</Text> : null}
                </View>
                {isOutgoing && (
                  <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white" /></Svg>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Input area */}
        <View style={{ borderTopWidth: 2, borderTopColor: '#fcd34d', backgroundColor: '#fffbeb' }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
            <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Comments are only visible to your team</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type @username to mention a teammate"
                placeholderTextColor="#9ca3af"
                style={{ flex: 1, color: '#374151', fontSize: 14 }}
              />
              <Pressable hitSlop={8} onPress={() => {
                if (!message.trim()) return;
                dispatch(conversationActions.sendMessage({
                  conversationId,
                  message: message.trim(),
                  private: false,
                } as any));
                setMessage('');
              }}><SendIcon /></Pressable>
            </View>
          </View>
          {/* Toolbar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#fde68a' }}>
            <ChatBlue />
            <View style={{ width: 1, height: 20, backgroundColor: '#fde68a' }} />
            <StarIcon />
            <ShortcutBlue />
            <ShortcutBlue />
            <AtIcon />
            <UsersIcon />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ===== Modals ===== */}
      {sheet === 'menu' && (
        <BottomSheet onClose={() => setSheet(null)}>
          {[
            { icon: <SearchIcon />, label: 'Search', onPress: () => setSheet('search' as any) },
            { icon: <WorkflowIcon />, label: 'Ongoing Workflow', onPress: () => setSheet('workflow') },
            { icon: <ShortcutIcon />, label: 'Select Shortcut', onPress: () => setSheet('shortcut') },
            { icon: <BlockSlash />, label: 'Block Contact', onPress: () => setSheet(null) },
          ].map((item, i) => (
            <Pressable key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i === 3 ? 0 : 1, borderBottomColor: '#f3f4f6' }} onPress={item.onPress}>
              <Text style={{ color: '#6b7280' }}>{item.icon}</Text>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>{item.label}</Text>
            </Pressable>
          ))}
        </BottomSheet>
      )}

      {sheet === 'assign' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>Assign User</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <SearchIcon />
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Search</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }} onPress={async () => { setAssignee('me'); await ConversationService.assignConversation({ conversationId, assigneeId: (conversation?.meta?.assignee?.id) ?? 0, teamId: '0' }); setSheet(null); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ position: 'relative', width: 36, height: 36, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>A</Text>
                <View style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 999, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' }} />
              </View>
              <Text style={{ color: '#111827', fontWeight: '500' }}>Assign to me</Text>
            </View>
            {assignee === 'me' && <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M5 13l4 4L19 7" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
          </Pressable>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }} onPress={async () => { setAssignee('unassigned'); await ConversationService.assignConversation({ conversationId, assigneeId: 0, teamId: '0' }); setSheet(null); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: '#f9a8d4', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={8} r={4} fill="#f9a8d4" /><Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#f9a8d4" /></Svg>
              </View>
              <Text style={{ color: '#111827', fontWeight: '500' }}>Unassign</Text>
            </View>
          </Pressable>
          <View style={{ height: 8 }} />
        </BottomSheet>
      )}

      {sheet === 'stage' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>Select Stage</Text>
            <Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Done</Text>
          </View>
          <Pressable style={{ width: '100%', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={() => setSheet(null)}>
            <Text style={{ color: '#374151', fontWeight: '500' }}>Clear Selection</Text>
          </Pressable>
          <Text style={{ paddingHorizontal: 20, color: '#14b8a6', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>Lifecycle Stages</Text>
          {lifecycleStages.map(s => (
            <Pressable key={s.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={async () => { setStage(s.label); setStageEmoji(s.emoji);
                const labelKey = s.label === 'New Lead' ? 'new' : s.label === 'Hot Lead' ? 'hot' : s.label === 'Payment' ? 'payment' : s.label === 'Customer' ? 'customer' : 'cold';
                await ConversationService.addOrUpdateConversationLabels({ conversationId, labels: [labelKey] });
                setSheet(null); }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text style={{ color: '#1f2937', fontWeight: '500' }}>{s.label}</Text>
              </View>
              {stage === s.label && <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
            </Pressable>
          ))}
          <Text style={{ paddingHorizontal: 20, color: '#14b8a6', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }}>Lost Stages</Text>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }} onPress={() => { setStage('Cold Lead'); setStageEmoji('🧊'); setSheet(null); }}>
            <Text style={{ fontSize: 20 }}>🧊</Text>
            <Text style={{ color: '#1f2937', fontWeight: '500' }}>Cold Lead</Text>
          </Pressable>
        </BottomSheet>
      )}

      {sheet === 'snooze' && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setSheet(null)}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%' }} onStartShouldSetResponder={() => true}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 }}>Snooze Conversation</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', textAlign: 'center', marginBottom: 12 }}>
              This action will snooze conversation with contact <Text style={{ fontWeight: 'bold' }}>{name}.</Text>
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 16 }}>Snooze until:</Text>
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
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>Select Shortcut</Text>
            <Pressable onPress={() => setSheet(null)}><XIcon /></Pressable>
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <SearchIcon />
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Search</Text>
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
            <ShortcutIcon />
            <Text style={{ color: '#9ca3af', fontWeight: '500' }}>No available shortcuts</Text>
          </View>
        </BottomSheet>
      )}

      {sheet === 'workflow' && (
        <BottomSheet onClose={() => setSheet(null)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable onPress={() => setSheet(null)}><XIcon /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#111827' }}>Ongoing Workflow</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Circle cx={11} cy={11} r={8} stroke="#14b8a6" strokeWidth={2} /><Path d="m21 21-4.35-4.35" stroke="#14b8a6" strokeWidth={2} strokeLinecap="round" /></Svg>
            <Text style={{ color: '#14b8a6', fontSize: 14 }}>Search ongoing Workflows</Text>
          </View>
          <Text style={{ color: '#4b5563', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32, paddingTop: 24, lineHeight: 22 }}>
            You can stop ongoing Workflows for this Contact here. Simply enable it in Workflow Settings and publish the Workflow on the web platform.
          </Text>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
};

// ---------- Contact Details Screen ----------
const ContactDetailsScreen = ({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) => {
  const name = conversation.meta?.sender?.name || 'khaled Ahmed';
  const inputCls = { width: '100%', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, color: '#1f2937', fontSize: 14 } as const;
  const labelCls = { fontWeight: '600', color: '#111827', marginBottom: 6, fontSize: 14 } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Pressable onPress={onBack} hitSlop={8}><ArrowLeft /></Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Contact Details</Text>
        <Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Save</Text>
      </View>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }} contentContainerStyle={{ gap: 20 }}>
        <View>
          <Text style={labelCls}>Last Na...</Text>
          <TextInput defaultValue="Ahmed" style={inputCls} />
        </View>
        <View>
          <Text style={labelCls}>Langua...</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Add Language</Text>
            <ChevronDown />
          </View>
        </View>
        <View>
          <Text style={labelCls}>Phone</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 14 }}>🇪🇬</Text>
              <Text style={{ fontSize: 14, color: '#374151', marginLeft: 4 }}>+20</Text>
              <ChevronDown />
            </View>
            <TextInput defaultValue="1146048286" style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: '#374151', fontSize: 14 }} />
          </View>
        </View>
        <View>
          <Text style={labelCls}>Count...</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14 }}>🇪🇬</Text>
              <Text style={{ color: '#1f2937', fontSize: 14, fontWeight: '500' }}>Egypt</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <XIcon />
              <ChevronDown />
            </View>
          </View>
        </View>
        <View>
          <Text style={labelCls}>Em...</Text>
          <TextInput placeholder="Add Email" placeholderTextColor="#9ca3af" style={inputCls} />
        </View>
        <View>
          <Text style={labelCls}>Assign...</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ color: '#1f2937', fontSize: 14, fontWeight: '500' }}>Ahmed Adel</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <XIcon />
              <ChevronDown />
            </View>
          </View>
        </View>
        <View>
          <Text style={labelCls}>Lifecyc...</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>🆕</Text>
              <Text style={{ color: '#1f2937', fontSize: 14, fontWeight: '500' }}>New Lead</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <XIcon />
              <ChevronDown />
            </View>
          </View>
        </View>
        <View>
          <Text style={labelCls}>Tags</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Add Ta...</Text>
            <ChevronDown />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Inbox Screen ----------
const InboxScreenDesign = () => {
  const dispatch = useAppDispatch();
  const allConversations = useAppSelector(selectAllConversations);
  const conversationsLoading = useAppSelector(selectConversationsLoading);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('all');
  const [activeLabel, setActiveLabel] = useState('All');
  const [tab, setTab] = useState<'all' | 'open' | 'closed' | 'snoozed'>('all');
  const [showSort, setShowSort] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    dispatch(conversationActions.fetchConversations({
      status: tab === 'all' ? 'all' : tab,
      assigneeType: 'all',
      page: 1,
      sortBy: 'latest',
    } as any));
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(conversationActions.fetchConversations({
      status: tab === 'all' ? 'all' : tab,
      assigneeType: 'all',
      page: 1,
      sortBy: 'latest',
    } as any)).finally(() => setRefreshing(false));
  };

  if (selectedConversationId) {
    return <ChatScreenDesign conversationId={selectedConversationId} onBack={() => setSelectedConversationId(null)} />;
  }

  if (showSearch) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <SearchIcon />
            <TextInput autoFocus placeholder={`Search in ${activeLabel} inbox`} placeholderTextColor="#9ca3af" style={{ flex: 1, color: '#1f2937', fontSize: 14 }} />
          </View>
          <Pressable onPress={() => setShowSearch(false)}><Text style={{ color: '#3b82f6', fontWeight: '500', fontSize: 14 }}>Cancel</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <View style={{ flex: 1, backgroundColor: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}><HamburgerIcon /></Pressable>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827' }}>{activeLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setShowSearch(true)} hitSlop={8}><SearchIcon /></Pressable>
            <Pressable hitSlop={8}><UserCircleIcon /></Pressable>
            <Pressable onPress={() => setShowSort(true)} hitSlop={8}><FilterIcon /></Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {(['all', 'open', 'closed', 'snoozed'] as const).map(t => (
            <FilterChip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </View>

        {/* Conversation list */}
        {conversationsLoading && allConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : allConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 64 }}>
            <ChatBubbleIcon />
            <Text style={{ color: '#1f2937', fontWeight: '600' }}>No conversations to show</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 80 }}>
            {allConversations.map(item => {
              const cname = item.meta?.sender?.name || item.meta?.sender?.email || 'Unknown';
              const clastMsg = item.lastNonActivityMessage?.content || item.messages?.[item.messages.length - 1]?.content || '';
              const cassignee = item.meta?.assignee;
              const cassigneeInitial = cassignee?.name ? cassignee.name.charAt(0).toUpperCase() : 'A';
              const ctime = item.lastActivityAt ? new Date(item.lastActivityAt * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
              const tag = item.labels?.[0];
              const tagEmoji = tag === 'new' ? '🆕' : tag === 'hot' ? '🔥' : tag === 'payment' ? '💵' : tag === 'customer' ? '😍' : tag === 'cold' ? '🧊' : '🏷️';
              const tagLabel = tag === 'new' ? 'New Lead' : tag === 'hot' ? 'Hot Lead' : tag === 'payment' ? 'Payment' : tag === 'customer' ? 'Customer' : tag === 'cold' ? 'Cold Lead' : tag;
              return (
                <Pressable key={String(item.id)} onPress={() => setSelectedConversationId(Number(item.id))} style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>😊</Text>
                      </View>
                      <Text style={{ fontWeight: '600', color: '#111827', fontSize: 15 }}>{cname}</Text>
                    </View>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>{ctime}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingLeft: 52 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12 }}>{tagEmoji}</Text>
                      <Text style={{ color: '#374151', fontSize: 12, fontWeight: '500' }}>{tagLabel}</Text>
                    </View>
                    <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{cassigneeInitial}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* FAB Unreplied */}
        <Pressable
          onPress={() => setShowSort(true)}
          style={{
            position: 'absolute',
            bottom: 80,
            right: 16,
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: '#f3f4f6',
          }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>Unreplied</Text>
        </Pressable>

        {/* Drawer overlay */}
        {drawerOpen && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 40, flexDirection: 'row' }} onStartShouldSetResponder={() => true} onResponderRelease={() => setDrawerOpen(false)}>
            <View style={{ height: '100%', backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, width: '83%' }} onStartShouldSetResponder={() => true}>
              <InboxDrawer
                activeItem={activeItem}
                onSelect={(key, label) => { setActiveItem(key); setActiveLabel(label); }}
                onClose={() => setDrawerOpen(false)}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 96, paddingRight: 8 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>replied</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sort Bottom Sheet */}
        {showSort && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setShowSort(false)}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
              {['Newest Message', 'Oldest Message', 'Longest Closed', 'Shortest Closed'].map((opt, i) => (
                <Pressable key={i} onPress={() => setShowSort(false)} style={{ width: '100%', alignItems: 'flex-start', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: i === 3 ? 0 : 1, borderBottomColor: '#f3f4f6' }}>
                  <Text style={{ color: '#1f2937', fontSize: 16 }}>{opt}</Text>
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
