import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { conversationActions } from '@/store/conversation/conversationActions';
import {
  selectAllConversations,
  selectConversationsLoading,
} from '@/store/conversation/conversationSelectors';
import { selectUserId } from '@/store/auth/authSelectors';
import { selectAllInboxes } from '@/store/inbox/inboxSelectors';
import { profileService, LifecycleStage } from '@/services/profileService';
import { contactService } from '@/services/contactService';
import { useTheme } from '@/theme';

// ---------- Reference-exact icons ----------
const HamburgerIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SearchIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const FilterIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="11" y1="18" x2="13" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const UserCircleIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
    <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.8" />
    <Path d="M5.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="18" cy="5" r="4" fill="#22c55e" />
  </Svg>
);

const PhoneMissedIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width="52" height="52" viewBox="0 0 24 24" fill="none">
    <Path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.62 10.79z" stroke={color} strokeWidth="1.5" />
    <Path d="M17 3l-4 4m4 0l-4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const ArrowLeftIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChevronDown = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Drawer item icons
const AllInboxIcon = ({ active }: { active: boolean }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
      stroke={active ? '#3b82f6' : 'currentColor'}
      strokeWidth="1.8"
      fill={active ? '#dbeafe' : 'none'}
    />
    <Path d="M3 12h4l2 3h6l2-3h4" stroke={active ? '#3b82f6' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const MineIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8" />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5" />
    <Path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const UnassignedIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.8" />
    <Path d="M3 20c0-3.3 2.7-6 6-6m6-1v6m-3-3h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const LifecycleIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const CustoIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Utility helpers for full name and timestamp formatting
const parseDate = (val: any): Date | null => {
  if (!val) return null;
  if (typeof val === 'number') {
    return new Date(val > 1e11 ? val : val * 1000);
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      return new Date(num > 1e11 ? num : num * 1000);
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const formatChatTime = (timestamp: any): string => {
  const d = parseDate(timestamp);
  if (!d) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHours < 48) {
    return 'Yesterday';
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getContactName = (sender: any): string => {
  if (!sender) return 'Unknown Contact';
  if (sender.name && sender.name.trim()) return sender.name.trim();
  if (sender.availableName && sender.availableName.trim()) return sender.availableName.trim();
  if (sender.available_name && sender.available_name.trim()) return sender.available_name.trim();
  if (sender.additionalAttributes?.name && sender.additionalAttributes.name.trim()) {
    return sender.additionalAttributes.name.trim();
  }
  if (sender.customAttributes?.name && sender.customAttributes.name.trim()) {
    return sender.customAttributes.name.trim();
  }
  if (sender.phoneNumber || sender.phone_number) {
    return String(sender.phoneNumber || sender.phone_number);
  }
  if (sender.email) return sender.email;
  if (sender.identifier) return String(sender.identifier);
  return 'Unknown Contact';
};

// Filter Chip
const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  const { isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
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

const CALL_TABS = [
  { key: 'all', label: 'All' },
  { key: 'missed', label: 'Missed' },
  { key: 'noAnswer', label: 'No Answer' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'ended', label: 'Ended' },
];

// Shared Drawer
const InboxDrawer = ({
  activeItem,
  onSelect,
  onClose,
}: {
  activeItem: string;
  onSelect: (key: string, label: string) => void;
  onClose: () => void;
}) => {
  const conversations = useAppSelector(selectAllConversations);
  const userId = useAppSelector(selectUserId);
  const inboxes = useAppSelector(selectAllInboxes);
  const conversationMeta = useAppSelector(state => state.conversations.meta);

  const [lifecycleOpen, setLifecycleOpen] = useState(true);
  const [custoOpen, setCustoOpen] = useState(true);
  const [apiLifecycleStages, setApiLifecycleStages] = useState<LifecycleStage[]>([]);

  useEffect(() => {
    profileService
      .listLifecycleStages()
      .then(stages => {
        if (stages && Array.isArray(stages) && stages.length > 0) {
          setApiLifecycleStages(stages);
        }
      })
      .catch(() => {});
  }, []);

  const apiAllCount = conversationMeta?.allCount || conversations.length;
  const apiMineCount = conversationMeta?.mineCount ?? conversations.filter(c => c.meta?.assignee?.id === userId).length;
  const apiUnassignedCount = conversationMeta?.unassignedCount ?? conversations.filter(c => !c.meta?.assignee).length;

  const mainItems = [
    { key: 'all', label: 'All', icon: <AllInboxIcon active={activeItem === 'all'} />, count: apiAllCount },
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
        <Text style={{ fontSize: 24, fontWeight: '700', color: textPrimary }}>Calls Inbox</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable hitSlop={8}>
            <UserCircleIcon color={isDark ? '#94a3b8' : '#374151'} />
          </Pressable>
          <Pressable hitSlop={8}>
            <FilterIcon color={isDark ? '#94a3b8' : '#374151'} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingBottom: 16 }}>
        {mainItems.map(({ key, label, icon, count }) => {
          const isActive = activeItem === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                onSelect(key, label);
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: isActive ? 12 : 16,
                marginHorizontal: isActive ? 12 : 0,
                borderRadius: isActive ? 12 : 0,
                backgroundColor: isActive ? activeItemBg : 'transparent',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {icon}
                <Text style={{ fontWeight: '500', color: isActive ? activeItemText : textSecondary }}>{label}</Text>
              </View>
              <Text style={{ fontSize: 14, color: isActive ? activeItemText : '#9ca3af' }}>{count}</Text>
            </Pressable>
          );
        })}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        <Pressable onPress={() => setLifecycleOpen(!lifecycleOpen)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LifecycleIcon color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={{ fontWeight: '600', color: textPrimary }}>Lifecycle Stages</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#374151'} />
        </Pressable>
        {lifecycleOpen &&
          lifecycle.map(({ key, label, emoji, count }) => (
            <Pressable key={key} onPress={() => { onSelect(key, label); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{emoji}</Text>
                <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>{label}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#9ca3af' }}>{count}</Text>
            </Pressable>
          ))}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: dividerColor }} />

        <Pressable onPress={() => setCustoOpen(!custoOpen)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CustoIcon color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={{ fontWeight: '600', color: textPrimary }}>Inboxes</Text>
          </View>
          <ChevronDown color={isDark ? '#94a3b8' : '#374151'} />
        </Pressable>
        {custoOpen && (
          inboxes.length > 0 ? (
            inboxes.map(inb => {
              const inbCount = conversations.filter(c => c.inboxId === inb.id).length;
              return (
                <Pressable key={String(inb.id)} onPress={() => { onSelect(`inbox_${inb.id}`, inb.name); onClose(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '500' }}>{inb.name}</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>{inbCount}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No inboxes</Text>
          )
        )}
      </ScrollView>
    </View>
  );
};

// Add Contact Screen
const AddContactScreen = ({ onBack }: { onBack: () => void }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName && !phone && !email) {
      Alert.alert('Validation Error', 'Please enter at least a name, phone number, or email.');
      return;
    }
    try {
      setSaving(true);
      await contactService.createContact({
        name: fullName || 'New Contact',
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
      });
      Alert.alert('Success', 'Contact created successfully!');
      onBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    color: '#374151',
    fontSize: 14,
  } as const;

  const labelStyle = { fontWeight: '600', color: '#111827', marginBottom: 6, fontSize: 14 } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Pressable onPress={onBack} hitSlop={8}>
          <ArrowLeftIcon />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Add Contact</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
          {saving ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={{ color: '#2563eb', fontWeight: '600', fontSize: 14 }}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }} contentContainerStyle={{ gap: 20 }}>
        <View>
          <Text style={labelStyle}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} placeholder="Add First Name" placeholderTextColor="#9ca3af" style={inputStyle} />
        </View>
        <View>
          <Text style={labelStyle}>Last Name</Text>
          <TextInput value={lastName} onChangeText={setLastName} placeholder="Add Last Name" placeholderTextColor="#9ca3af" style={inputStyle} />
        </View>
        <View>
          <Text style={labelStyle}>Phone</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 14, color: '#374151' }}>📞</Text>
              <ChevronDown />
            </View>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Add Phone Number" placeholderTextColor="#9ca3af" keyboardType="phone-pad" style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: '#374151', fontSize: 14 }} />
          </View>
        </View>
        <View>
          <Text style={labelStyle}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Add Email" placeholderTextColor="#9ca3af" keyboardType="email-address" style={inputStyle} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Calls Screen Main Component
const CallsScreenDesign = () => {
  const dispatch = useAppDispatch();
  const allConversations = useAppSelector(selectAllConversations);
  const conversationsLoading = useAppSelector(selectConversationsLoading);
  const userId = useAppSelector(selectUserId);

  const [tab, setTab] = useState<'all' | 'missed' | 'noAnswer' | 'ongoing' | 'ended'>('all');
  const [showSort, setShowSort] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('all');
  const [activeLabel, setActiveLabel] = useState('All');
  const [showAddContact, setShowAddContact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    dispatch(
      conversationActions.fetchConversationsMeta({
        status: 'all',
        assigneeType: activeItem === 'mine' ? 'me' : activeItem === 'unassigned' ? 'unassigned' : 'all',
      } as any),
    );
    dispatch(
      conversationActions.fetchConversations({
        status: 'all',
        assigneeType: activeItem === 'mine' ? 'me' : activeItem === 'unassigned' ? 'unassigned' : 'all',
        page: 1,
        sortBy: sortOrder,
      } as any),
    );
  }, [dispatch, activeItem, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const conversations = useMemo(() => {
    return allConversations.filter(item => {
      const channelType = (item as any)?.inbox?.channelType || (item as any)?.channelType || (item as any)?.channel_type;
      const isCallChannel = channelType === 'Channel::Phone' || channelType === 'Channel::Voice' || item.additionalAttributes?.type === 'call';

      if (!isCallChannel) return false;

      if (activeItem === 'mine' && item.meta?.assignee?.id !== userId) return false;
      if (activeItem === 'unassigned' && item.meta?.assignee) return false;
      if (activeItem.startsWith('inbox_') && item.inboxId !== Number(activeItem.replace('inbox_', ''))) return false;

      if (tab === 'missed' && item.status !== 'open') return false;
      if (tab === 'ended' && item.status !== 'resolved') return false;
      return true;
    });
  }, [allConversations, tab, activeItem, userId]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(item => {
      const cname = getContactName(item.meta?.sender).toLowerCase();
      const email = (item.meta?.sender?.email || '').toLowerCase();
      const phone = (item.meta?.sender?.phoneNumber || (item.meta?.sender as any)?.phone_number || '').toLowerCase();
      const lastMsg = (item.lastNonActivityMessage?.content || item.messages?.[item.messages.length - 1]?.content || '').toLowerCase();
      return cname.includes(q) || email.includes(q) || phone.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery]);

  const { isDark } = useTheme();
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';
  const inputBg = isDark ? '#1e293b' : '#f3f4f6';

  if (showAddContact) {
    return <AddContactScreen onBack={() => setShowAddContact(false)} />;
  }

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
              placeholder="Search for Contacts"
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, color: textPrimary, fontSize: 14 }}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <XIcon />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); }} hitSlop={8}>
            <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {filteredConversations.map(item => {
            const name = getContactName(item.meta?.sender);
            const lastMsg = item.lastNonActivityMessage?.content || item.messages?.[item.messages.length - 1]?.content || '';
            const time = formatChatTime(item.lastActivityAt || (item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.createdAt : null));
            return (
              <View key={String(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                {item.meta?.sender?.thumbnail ? (
                  <Image source={{ uri: item.meta.sender.thumbnail }} style={{ width: 44, height: 44, borderRadius: 999 }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#d97706', fontSize: 16, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600', color: textPrimary, fontSize: 15 }} numberOfLines={1}>{name}</Text>
                    <Text style={{ color: textSecondary, fontSize: 12 }}>{time}</Text>
                  </View>
                  <Text style={{ color: textSecondary, fontSize: 14, marginTop: 2 }} numberOfLines={1}>{lastMsg}</Text>
                </View>
              </View>
            );
          })}
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
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}>
              <HamburgerIcon color={textPrimary} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '600', color: textPrimary }}>{activeLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Pressable onPress={() => setShowSearch(true)} hitSlop={8}>
              <SearchIcon color={textPrimary} />
            </Pressable>
            <Pressable onPress={() => setShowAddContact(true)} hitSlop={8}>
              <UserCircleIcon color={textPrimary} />
            </Pressable>
            <Pressable onPress={() => setShowSort(true)} hitSlop={8}>
              <FilterIcon color={textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {CALL_TABS.map((t) => (
            <FilterChip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key as typeof tab)} />
          ))}
        </View>

        {/* Calls List */}
        {conversationsLoading && filteredConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 64 }}>
            <PhoneMissedIcon />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: textPrimary, fontWeight: '600' }}>No calls</Text>
              <Text style={{ color: textSecondary, fontSize: 14 }}>Set up calls in Channel settings in Web</Text>
            </View>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
            contentContainerStyle={{ paddingBottom: 80 }}>
            {filteredConversations.map(item => {
              const name = getContactName(item.meta?.sender);
              const lastMsg = item.lastNonActivityMessage?.content || item.messages?.[item.messages.length - 1]?.content || '';
              const time = formatChatTime(item.lastActivityAt || (item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.createdAt : null));
              return (
                <View key={String(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                  {item.meta?.sender?.thumbnail ? (
                    <Image source={{ uri: item.meta.sender.thumbnail }} style={{ width: 44, height: 44, borderRadius: 999 }} />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#d97706', fontSize: 16, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '600', color: textPrimary, fontSize: 15 }} numberOfLines={1}>{name}</Text>
                      <Text style={{ color: textSecondary, fontSize: 12 }}>{time}</Text>
                    </View>
                    <Text style={{ color: textSecondary, fontSize: 14, marginTop: 2 }} numberOfLines={1}>{lastMsg}</Text>
                  </View>
                </View>
              );
            })}
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
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setDrawerOpen(false)} />
          </View>
        )}

        {/* Sort Sheet */}
        {showSort && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setShowSort(false)}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: isDark ? '#1e293b' : 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, backgroundColor: isDark ? '#475569' : '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />
              {[
                { label: 'Newest', order: 'latest' as const },
                { label: 'Oldest', order: 'oldest' as const },
              ].map((opt, i) => (
                <Pressable
                  key={opt.order}
                  onPress={() => { setSortOrder(opt.order); setShowSort(false); }}
                  style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: i === 1 ? 0 : 1, borderBottomColor: borderColor }}>
                  <Text style={{ color: textPrimary, fontSize: 16, fontWeight: sortOrder === opt.order ? '600' : '400' }}>{opt.label}</Text>
                  {sortOrder === opt.order && <Text style={{ color: '#3b82f6', fontWeight: '700' }}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CallsScreenDesign;
