import React, { useState, useEffect } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { ConversationService } from '@/store/conversation/conversationService';
import type { Conversation } from '@/types/Conversation';

// ---------- Reference-exact icons (from wapilot-design/src/App.tsx) ----------
const HamburgerIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <Line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SearchIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
    <Path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const FilterIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <Line x1="11" y1="18" x2="13" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const UserCircleIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
    <Circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M5.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="18" cy="5" r="4" fill="#22c55e" />
  </Svg>
);

const PhoneMissedIcon = () => (
  <Svg width="52" height="52" viewBox="0 0 24 24" fill="none">
    <Path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.62 10.79z" stroke="#9ca3af" strokeWidth="1.5" />
    <Path d="M17 3l-4 4m4 0l-4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const ArrowLeftIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChevronDown = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const MineIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
    <Circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    <Path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const UnassignedIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M3 20c0-3.3 2.7-6 6-6m6-1v6m-3-3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const LifecycleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const TeamIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const CustoIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------- Filter Chip (reference-exact) ----------
const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: active ? '#111827' : '#f3f4f6',
    }}>
    <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#ffffff' : '#374151' }}>{label}</Text>
  </Pressable>
);

const CALL_TABS = [
  { key: 'all', label: 'All' },
  { key: 'missed', label: 'Missed' },
  { key: 'noAnswer', label: 'No Answer' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'ended', label: 'Ended' },
];

const LIFECYCLE_ITEMS = [
  { key: 'newlead', label: 'New Lead', emoji: '🆕' },
  { key: 'hotlead', label: 'Hot Lead', emoji: '🔥' },
  { key: 'payment', label: 'Payment', emoji: '💵' },
  { key: 'customer', label: 'Customer', emoji: '😍' },
];

// ---------- Inbox Drawer (reference-exact, shared) ----------
const InboxDrawer = ({
  activeItem,
  onSelect,
  onClose,
}: {
  activeItem: string;
  onSelect: (key: string, label: string) => void;
  onClose: () => void;
}) => {
  const [lifecycleOpen, setLifecycleOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);
  const [custoOpen, setCustoOpen] = useState(true);

  const mainItems = [
    { key: 'all', label: 'All', icon: <AllInboxIcon active={activeItem === 'all'} /> },
    { key: 'mine', label: 'Mine', icon: <MineIcon /> },
    { key: 'unassigned', label: 'Unassigned', icon: <UnassignedIcon /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>Inbox</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable hitSlop={8}>
            <UserCircleIcon />
          </Pressable>
          <Pressable hitSlop={8}>
            <FilterIcon />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingBottom: 16 }}>
        {mainItems.map(({ key, label, icon }) => {
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
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {icon}
                <Text style={{ fontWeight: '500', color: isActive ? '#2563eb' : '#374151' }}>{label}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>0</Text>
            </Pressable>
          );
        })}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: '#f3f4f6' }} />

        <Pressable onPress={() => setLifecycleOpen(!lifecycleOpen)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LifecycleIcon />
            <Text style={{ fontWeight: '600', color: '#111827' }}>Lifecycle</Text>
          </View>
          <ChevronDown />
        </Pressable>
        {lifecycleOpen &&
          LIFECYCLE_ITEMS.map(({ key, label, emoji }) => (
            <Pressable key={key} onPress={() => onSelect(key, label)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 18, width: 20, textAlign: 'center' }}>{emoji}</Text>
                <Text style={{ color: '#374151' }}>{label}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>0</Text>
            </Pressable>
          ))}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: '#f3f4f6' }} />

        <Pressable onPress={() => setTeamOpen(!teamOpen)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TeamIcon />
            <Text style={{ fontWeight: '600', color: '#111827' }}>Team</Text>
          </View>
          <ChevronDown />
        </Pressable>
        {teamOpen && <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No inboxes available</Text>}

        <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: '#f3f4f6' }} />

        <Pressable onPress={() => setCustoOpen(!custoOpen)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CustoIcon />
            <Text style={{ fontWeight: '600', color: '#111827' }}>Custo</Text>
          </View>
          <ChevronDown />
        </Pressable>
        {custoOpen && <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#9ca3af', fontSize: 14 }}>No inboxes available</Text>}
      </ScrollView>
    </View>
  );
};

// ---------- Add Contact Screen (reference-exact) ----------
const AddContactScreen = ({ onBack }: { onBack: () => void }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

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
        <Pressable hitSlop={8}>
          <Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Save</Text>
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
              <Text style={{ fontSize: 14, color: '#374151' }}>🇺🇸</Text>
              <Text style={{ fontSize: 14, color: '#374151', marginLeft: 4 }}>+1</Text>
              <ChevronDown />
            </View>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Add Phone Number" placeholderTextColor="#9ca3af" keyboardType="phone-pad" style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: '#374151', fontSize: 14 }} />
          </View>
        </View>
        <View>
          <Text style={labelStyle}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Add Email" placeholderTextColor="#9ca3af" style={inputStyle} />
        </View>
        <View>
          <Text style={labelStyle}>Assignee</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>Ahmed Adel</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <XIcon />
              <ChevronDown />
            </View>
          </View>
        </View>
        <View>
          <Text style={labelStyle}>Lifecycle</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>Add Lifecycle</Text>
            <ChevronDown />
          </View>
        </View>
        <View>
          <Text style={labelStyle}>Tags</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>Add Tags</Text>
            <ChevronDown />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Calls Search Screen (reference-exact) ----------
const CallsSearchScreen = ({ onCancel }: { onCancel: () => void }) => {
  const [query, setQuery] = useState('');
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
          <SearchIcon />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search for Contacts"
            placeholderTextColor="#9ca3af"
            style={{ flex: 1, color: '#374151', fontSize: 14 }}
          />
        </View>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1 }} />
    </SafeAreaView>
  );
};

// ---------- Calls Screen (reference-exact from wapilot-design/src/App.tsx L522-617) ----------
const CallsScreenDesign = () => {
  const [tab, setTab] = useState<'all' | 'missed' | 'noAnswer' | 'ongoing' | 'ended'>('all');
  const [showSort, setShowSort] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('all');
  const [showAddContact, setShowAddContact] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await ConversationService.getConversations({
        page: 1,
        status: 'open',
        assigneeType: 'me',
        sortBy: 'latest',
      });
      setConversations(res.conversations);
    } catch (e) {
      console.log('[Calls] loadConversations error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'missed', label: 'Missed' },
    { key: 'noAnswer', label: 'No Answer' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'ended', label: 'Ended' },
  ];

  if (showAddContact) {
    return <AddContactScreen onBack={() => setShowAddContact(false)} />;
  }
  if (showSearch) {
    return <CallsSearchScreen onCancel={() => setShowSearch(false)} />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <View style={{ flex: 1, backgroundColor: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}>
              <HamburgerIcon />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827' }}>All</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Pressable onPress={() => setShowSearch(true)} hitSlop={8}>
              <SearchIcon />
            </Pressable>
            <Pressable onPress={() => setShowAddContact(true)} hitSlop={8}>
              <UserCircleIcon />
            </Pressable>
            <Pressable onPress={() => setShowSort(true)} hitSlop={8}>
              <FilterIcon />
            </Pressable>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, overflow: 'hidden' }}>
          {tabs.map((t) => (
            <FilterChip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key as typeof tab)} />
          ))}
        </View>

        {/* Conversations list */}
        {loading && conversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : conversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 64 }}>
            <PhoneMissedIcon />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#1f2937', fontWeight: '600' }}>No calls</Text>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>Set up calls in Channel settings in Web</Text>
            </View>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 80 }}>
            {conversations.map(item => {
              const name = item.meta?.sender?.name || item.meta?.sender?.email || 'Unknown';
              const lastMsg = item.lastNonActivityMessage?.content || item.messages?.[item.messages.length - 1]?.content || '';
              return (
                <View key={String(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600' }}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '600', color: '#111827', fontSize: 15 }} numberOfLines={1}>{name}</Text>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>{item.unreadCount > 0 ? `${item.unreadCount} new` : ''}</Text>
                    </View>
                    <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }} numberOfLines={1}>{lastMsg}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Drawer overlay */}
        {drawerOpen && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 40, flexDirection: 'row' }} onStartShouldSetResponder={() => true} onResponderRelease={() => setDrawerOpen(false)}>
            <View style={{ height: '100%', backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, width: '83%' }} onStartShouldSetResponder={() => true}>
              <InboxDrawer
                activeItem={activeItem}
                onSelect={(key) => setActiveItem(key)}
                onClose={() => setDrawerOpen(false)}
              />
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 64, paddingRight: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' }}>Ended</Text>
            </View>
          </View>
        )}

        {/* Sort Bottom Sheet — Newest / Oldest only */}
        {showSort && (
          <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={() => setShowSort(false)}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 }} onStartShouldSetResponder={() => true}>
              <View style={{ width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
              {['Newest', 'Oldest'].map((opt, i) => (
                <Pressable key={i} onPress={() => setShowSort(false)} style={{ width: '100%', alignItems: 'flex-start', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: i === 1 ? 0 : 1, borderBottomColor: '#f3f4f6' }}>
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

export default CallsScreenDesign;
