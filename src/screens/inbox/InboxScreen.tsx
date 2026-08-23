import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerLayout } from 'react-native-gesture-handler';
import { StackActions, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { TAB_BAR_HEIGHT } from '@/constants';
import { tailwind } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectUserId } from '@/store/auth/authSelectors';
import { conversationActions } from '@/store/conversation/conversationActions';
import {
  selectConversationsLoading,
  selectIsAllConversationsFetched,
} from '@/store/conversation/conversationSelectors';
import { clearAllConversations } from '@/store/conversation/conversationSlice';
import { selectAllInboxes } from '@/store/inbox/inboxSelectors';
import { selectAllLabels } from '@/store/label/labelSelectors';
import { conversationService } from '@/services/conversationService';
import { profileService, LifecycleStage } from '@/services/profileService';
import { FilterChips, EmptyState, Sidebar, FAB, Icon } from '@/components-next';
import { ConversationItemContainer } from '@/screens/conversations/components';
import { EmptyConversationsIcon, SearchIcon } from '@/svg-icons';
import { getChannelIcon } from '@/utils';
import type { Conversation, Label, Channel } from '@/types';
import type { Inbox } from '@/types/Inbox';
import type { ConversationPayload } from '@/store/conversation/conversationTypes';
import type { AssigneeTypes, ConversationStatus } from '@/types/common/ConversationStatus';

const STATUS_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'snoozed', label: 'Snoozed' },
];

const STATUS_MAP: Record<string, ConversationStatus | undefined> = {
  all: undefined,
  open: 'open',
  closed: 'resolved',
  snoozed: 'snoozed',
};

const ASSIGNEE_MAP: Record<string, AssigneeTypes> = {
  all: 'all',
  mine: 'me',
  unassigned: 'unassigned',
};

const MenuIcon = ({ stroke = '#111827' }: { stroke?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12h18M3 6h18M3 18h18"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InboxScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSidebar, setSelectedSidebar] = useState('all');

  // List & pagination state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [isFlashListReady, setFlashListReady] = useState(false);
  const drawerRef = useRef<DrawerLayout>(null);
  const openedRowIndex = useSharedValue<number | null>(null);

  // Dynamic meta counts & lifecycle stages
  const [counts, setCounts] = useState({ mine_count: 0, unassigned_count: 0, all_count: 0 });
  const [lifecycleStages, setLifecycleStages] = useState<LifecycleStage[]>([]);

  // Redux Selectors
  const userId = useAppSelector(selectUserId);
  const isConversationsLoading = useAppSelector(selectConversationsLoading);
  const isAllConversationsFetched = useAppSelector(selectIsAllConversationsFetched);
  const inboxes = useAppSelector(selectAllInboxes) as Inbox[];
  const labels = useAppSelector(selectAllLabels) as Label[];

  const allConversations = useAppSelector(state => {
    return Object.values(state.conversations.entities) as Conversation[];
  });

  // Fetch meta counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await conversationService.getConversationCounts();
      if (res) {
        setCounts({
          mine_count: res.mine_count || 0,
          unassigned_count: res.unassigned_count || 0,
          all_count: res.all_count || 0,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch lifecycle stages
  useEffect(() => {
    fetchCounts();
    profileService
      .listLifecycleStages()
      .then(stages => setLifecycleStages(stages || []))
      .catch(() => {});
  }, [fetchCounts]);

  // Client-side filtering logic based on selected status & sidebar section
  const conversations = useMemo(() => {
    const filtered = allConversations.filter((conv: Conversation) => {
      // Status Filter
      const targetStatus = STATUS_MAP[selectedStatus];
      if (targetStatus && conv.status !== targetStatus) {
        return false;
      }

      // Sidebar Filter
      if (selectedSidebar === 'mine') {
        return conv.meta?.assignee?.id === userId;
      }
      if (selectedSidebar === 'unassigned') {
        return !conv.meta?.assignee;
      }
      if (selectedSidebar.startsWith('inbox_')) {
        const inboxId = Number(selectedSidebar.replace('inbox_', ''));
        return conv.inboxId === inboxId;
      }
      if (selectedSidebar.startsWith('label_')) {
        const labelTitle = selectedSidebar.replace('label_', '');
        return (conv.labels || []).includes(labelTitle);
      }
      if (selectedSidebar.startsWith('stage_')) {
        const stageId = selectedSidebar.replace('stage_', '');
        const stageObj = lifecycleStages.find(s => String(s.id) === stageId);
        if (stageObj) {
          return (conv.labels || []).some(l => l.toLowerCase().includes(stageObj.name.toLowerCase()));
        }
      }
      return true;
    });

    const getTime = (conv: Conversation): number => {
      // Treat 0 / null / undefined as "no value" so they fall back to the next source
      const lastActivity = conv.lastActivityAt && Number(conv.lastActivityAt) > 0 ? Number(conv.lastActivityAt) : 0;
      if (lastActivity > 0) return lastActivity;
      const lastMsg =
        conv.messages && conv.messages.length > 0
          ? (conv.messages[conv.messages.length - 1]?.createdAt as number) || 0
          : 0;
      if (lastMsg > 0) return lastMsg;
      return (conv.createdAt as number) || 0;
    };

    return [...filtered].sort((a, b) => {
      const aTime = getTime(a);
      const bTime = getTime(b);
      return bTime - aTime;
    });
  }, [allConversations, selectedStatus, selectedSidebar, userId, lifecycleStages]);

  const fetchConversations = useCallback(
    async (page: number = 1) => {
      let assigneeType = ASSIGNEE_MAP[selectedSidebar] || 'all';
      let targetInboxId = 0;

      if (selectedSidebar.startsWith('inbox_')) {
        targetInboxId = Number(selectedSidebar.replace('inbox_', ''));
      }

      const payload: ConversationPayload = {
        status: STATUS_MAP[selectedStatus] || 'open',
        assigneeType,
        page,
        sortBy: 'latest',
        inboxId: targetInboxId,
      };
      dispatch(conversationActions.fetchConversations(payload));
    },
    [dispatch, selectedStatus, selectedSidebar],
  );

  const clearAndFetch = useCallback(async () => {
    setPageNumber(1);
    setFlashListReady(false);
    await dispatch(clearAllConversations());
    fetchConversations(1);
    fetchCounts();
  }, [dispatch, fetchConversations, fetchCounts]);

  useEffect(() => {
    clearAndFetch();
  }, [selectedStatus, selectedSidebar]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    clearAndFetch().finally(() => setIsRefreshing(false));
  }, [clearAndFetch]);

  const handleOnEndReached = useCallback(() => {
    if (isFlashListReady && !isAllConversationsFetched && !isConversationsLoading) {
      const nextPage = pageNumber + 1;
      setPageNumber(nextPage);
      fetchConversations(nextPage);
    }
  }, [
    isFlashListReady,
    isAllConversationsFetched,
    isConversationsLoading,
    pageNumber,
    fetchConversations,
  ]);

  const handleSidebarSelect = useCallback((id: string) => {
    setSelectedSidebar(id);
    drawerRef.current?.closeDrawer();
  }, []);

  const handleStatusFilter = useCallback((id: string) => {
    setSelectedStatus(id);
  }, []);

  const handleNavigateToChat = useCallback(
    (conversationId: number) => {
      navigation.dispatch(StackActions.push('ChatScreen', { conversationId }));
    },
    [navigation],
  );

  const renderConversationItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => (
      <Pressable onPress={() => handleNavigateToChat(item.id)}>
        <ConversationItemContainer
          index={index}
          conversationItem={item}
          openedRowIndex={openedRowIndex}
        />
      </Pressable>
    ),
    [handleNavigateToChat, openedRowIndex],
  );

  const ListFooterComponent = () => {
    if (isAllConversationsFetched || conversations.length === 0) return null;
    return (
      <View style={tailwind.style('flex-1 items-center justify-center pt-8 pb-4')}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  // Dynamic Sidebar Sections
  const sidebarSections = [
    {
      id: 'main',
      title: '',
      icon: <View />,
      items: [
        {
          id: 'all',
          label: 'All Conversations',
          icon: (
            <View style={tailwind.style('w-6 h-6 rounded-full bg-blue-100 items-center justify-center')}>
              <Text style={tailwind.style('text-xs text-blue-600 font-bold')}>💬</Text>
            </View>
          ),
          count: counts.all_count || allConversations.length,
        },
        {
          id: 'mine',
          label: 'Assigned to Me',
          icon: (
            <View style={tailwind.style('w-6 h-6 rounded-full bg-emerald-100 items-center justify-center')}>
              <Text style={tailwind.style('text-xs text-emerald-600 font-bold')}>👤</Text>
            </View>
          ),
          count: counts.mine_count,
        },
        {
          id: 'unassigned',
          label: 'Unassigned',
          icon: (
            <View style={tailwind.style('w-6 h-6 rounded-full bg-amber-100 items-center justify-center')}>
              <Text style={tailwind.style('text-xs text-amber-600 font-bold')}>❓</Text>
            </View>
          ),
          count: counts.unassigned_count,
        },
      ],
    },
    {
      id: 'inboxes',
      title: 'Inboxes',
      icon: (
        <View style={tailwind.style('w-5 h-5 rounded-full bg-purple-100 items-center justify-center')}>
          <Text style={tailwind.style('text-xs text-purple-600 font-bold')}>📥</Text>
        </View>
      ),
      items: (inboxes || []).map(inbox => ({
        id: `inbox_${inbox.id}`,
        label: inbox.name,
        icon: (
          <View style={tailwind.style('w-5 h-5 items-center justify-center')}>
            <Icon icon={getChannelIcon(inbox.channelType as Channel, inbox.medium, '')} size={16} />
          </View>
        ),
        count: allConversations.filter(c => c.inboxId === inbox.id).length,
      })),
    },
    {
      id: 'labels',
      title: 'Labels',
      icon: (
        <View style={tailwind.style('w-5 h-5 rounded-full bg-pink-100 items-center justify-center')}>
          <Text style={tailwind.style('text-xs text-pink-600 font-bold')}>🏷️</Text>
        </View>
      ),
      items: (labels || []).map(label => ({
        id: `label_${label.title}`,
        label: label.title,
        icon: (
          <View
            style={[
              tailwind.style('w-3.5 h-3.5 rounded-full'),
              { backgroundColor: label.color || '#3B82F6' },
            ]}
          />
        ),
        count: allConversations.filter(c => (c.labels || []).includes(label.title)).length,
      })),
    },
    {
      id: 'lifecycle',
      title: 'Lifecycle Stages',
      icon: (
        <View style={tailwind.style('w-5 h-5 rounded-full bg-teal-100 items-center justify-center')}>
          <Text style={tailwind.style('text-xs text-teal-600 font-bold')}>🌱</Text>
        </View>
      ),
      items: (lifecycleStages.length > 0
        ? lifecycleStages
        : [
            { id: 1, name: 'New Lead', color: '#10B981', icon: '🆕' },
            { id: 2, name: 'Hot Lead', color: '#EF4444', icon: '🔥' },
            { id: 3, name: 'Payment', color: '#3B82F6', icon: '💳' },
            { id: 4, name: 'Customer', color: '#F59E0B', icon: '⭐' },
          ]
      ).map(stage => ({
        id: `stage_${stage.id}`,
        label: stage.name,
        icon: (
          <View
            style={[
              tailwind.style('w-3.5 h-3.5 rounded-full'),
              { backgroundColor: stage.color || '#10B981' },
            ]}
          />
        ),
        count: allConversations.filter(c =>
          (c.labels || []).some(l => l.toLowerCase().includes(stage.name.toLowerCase())),
        ).length,
      })),
    },
  ];

  const getSelectedTitle = () => {
    const allItems = sidebarSections.flatMap(s => s.items);
    const selected = allItems.find(i => i.id === selectedSidebar);
    return selected?.label || 'All Conversations';
  };

  const shouldShowEmptyLoader = isConversationsLoading && allConversations.length === 0;

  const renderContent = () => {
    if (shouldShowEmptyLoader) {
      return (
        <View style={tailwind.style('flex-1 items-center justify-center')}>
          <ActivityIndicator size="small" />
        </View>
      );
    }

    if (conversations.length === 0) {
      return (
        <View style={tailwind.style('flex-1 items-center justify-center px-8')}>
          <EmptyState
            icon={<EmptyConversationsIcon size={64} color="#D1D5DB" />}
            title="No conversations to show"
          />
        </View>
      );
    }

    return (
      <FlashList
        data={conversations}
        renderItem={renderConversationItem}
        estimatedItemSize={91}
        keyExtractor={item => String(item.id)}
        onEndReached={handleOnEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#000" />
        }
        contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT - 1}px]`)}
        onScrollBeginDrag={() => {
          if (!isFlashListReady) {
            setFlashListReady(true);
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar translucent backgroundColor={tailwind.color('bg-white')} barStyle={'dark-content'} />
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={310}
        drawerPosition="left"
        drawerType="front"
        renderNavigationView={() => (
          <Sidebar
            sections={sidebarSections}
            selectedId={selectedSidebar}
            onSelect={handleSidebarSelect}
          />
        )}>
        <View style={tailwind.style('flex-1')}>
          {/* Header */}
          <View style={tailwind.style('flex-row items-center justify-between px-4 py-3 border-b border-gray-100')}>
            <Pressable onPress={() => drawerRef.current?.openDrawer()} hitSlop={16}>
              <View style={tailwind.style('w-9 h-9 rounded-lg bg-gray-50 items-center justify-center')}>
                <MenuIcon />
              </View>
            </Pressable>

            <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950 flex-1 text-center px-2')} numberOfLines={1}>
              {getSelectedTitle()}
            </Text>

            <Pressable
              onPress={() => navigation.dispatch(StackActions.push('SearchScreen'))}
              hitSlop={16}>
              <View style={tailwind.style('w-9 h-9 rounded-lg bg-gray-50 items-center justify-center')}>
                <Icon icon={<SearchIcon stroke="#111827" />} size={20} />
              </View>
            </Pressable>
          </View>

          {/* Filter Chips */}
          <FilterChips
            options={STATUS_FILTER_OPTIONS}
            selectedId={selectedStatus}
            onSelect={handleStatusFilter}
          />

          {/* Content */}
          <View style={tailwind.style('flex-1')}>{renderContent()}</View>


        </View>
      </DrawerLayout>
    </SafeAreaView>
  );
};

export default InboxScreen;
