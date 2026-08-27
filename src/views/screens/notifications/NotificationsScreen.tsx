import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, StatusBar, Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

import { TAB_BAR_HEIGHT } from '@/constants';
import { InboxListStateProvider } from '@/context';
import type { Notification } from '@/models/types/Notification';
import { tailwind, useTheme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notificationActions } from '@/viewmodels/store/notification/notificationAction';
import {
  selectIsAllNotificationsFetched,
  selectIsLoadingNotifications,
  getFilteredNotifications,
} from '@/viewmodels/store/notification/notificationSelectors';
import { InboxItemContainer } from '@/views/screens/inbox/components';
import { useInboxListStateContext } from '@/context';
import { resetNotifications } from '@/viewmodels/store/notification/notificationSlice';
import i18n from '@/i18n';
import { selectSortOrder } from '@/viewmodels/store/notification/notificationFilterSlice';
import { InboxSortTypes, NotificationFilterType } from '@/viewmodels/store/notification/notificationTypes';
import { InboxEmptyIcon } from '@/svg-icons';
import { FilterChips, EmptyState } from '@/views/components';

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<Notification>);

const FILTER_OPTIONS = [
  { id: 'new', label: 'New' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

const FILTER_EMPTY_MESSAGES: Record<NotificationFilterType, { title: string; subtitle: string }> = {
  new: { title: 'You are up to date!', subtitle: 'There are no new notifications.' },
  archived: { title: 'No archived notifications', subtitle: 'There are no archived notifications to show.' },
  all: { title: 'No notifications', subtitle: 'There are no notifications to show.' },
};

const InboxList = () => {
  const { isDark } = useTheme();
  const [pageNumber, setPageNumber] = useState(1);
  const [isFlashListReady, setFlashListReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<NotificationFilterType>('new');

  const isNotificationsLoading = useAppSelector(selectIsLoadingNotifications);
  const isAllNotificationsFetched = useAppSelector(selectIsAllNotificationsFetched);
  const sortOrder = useAppSelector(selectSortOrder);

  const notifications = useAppSelector(state => getFilteredNotifications(state, sortOrder));

  const previousSortOrder = useRef(sortOrder);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (previousSortOrder.current !== sortOrder) {
      previousSortOrder.current = sortOrder;
      clearAndFetchNotifications(sortOrder);
    }
  }, [sortOrder]);

  const ListFooterComponent = React.memo(() => {
    if (isAllNotificationsFetched) return null;
    return (
      <Animated.View
        style={tailwind.style(
          'flex-1 items-center justify-center pt-8',
          `pb-[${TAB_BAR_HEIGHT}px]`,
        )}>
        <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#2563eb'} />
      </Animated.View>
    );
  });

  useEffect(() => {
    clearAndFetchNotifications(sortOrder);
  }, []);

  const clearAndFetchNotifications = useCallback(
    async (sortOrder: InboxSortTypes, filterType: NotificationFilterType = selectedFilter) => {
      setPageNumber(1);
      await dispatch(resetNotifications());
      fetchNotifications(sortOrder, 1, filterType);
    },
    [selectedFilter],
  );

  const fetchNotifications = useCallback(
    async (
      sortOrder: InboxSortTypes,
      page: number = 1,
      filterType: NotificationFilterType = selectedFilter,
    ) => {
      dispatch(
        notificationActions.fetchNotifications({ page, sort_order: sortOrder, filterType }),
      );
    },
    [selectedFilter],
  );

  const onChangePageNumber = () => {
    const nextPageNumber = pageNumber + 1;
    setPageNumber(nextPageNumber);
    fetchNotifications(sortOrder, nextPageNumber);
  };

  const handleOnEndReached = () => {
    const shouldLoadMoreConversations =
      isFlashListReady && !isAllNotificationsFetched && !isNotificationsLoading;
    if (shouldLoadMoreConversations) {
      onChangePageNumber();
    }
  };

  const handleRefresh = useCallback(() => {
    setFlashListReady(false);
    setIsRefreshing(true);
    clearAndFetchNotifications(sortOrder).finally(() => {
      setIsRefreshing(false);
    });
  }, [clearAndFetchNotifications, sortOrder]);

  const handleFilterSelect = useCallback(
    (filterId: string) => {
      const filterType = filterId as NotificationFilterType;
      setSelectedFilter(filterType);
      clearAndFetchNotifications(sortOrder, filterType);
    },
    [sortOrder, clearAndFetchNotifications],
  );

  const { openedRowIndex } = useInboxListStateContext();

  const handleRender: ListRenderItem<Notification> = ({ item, index }) => {
    return (
      <InboxItemContainer
        item={item}
        index={index}
        openedRowIndex={openedRowIndex as SharedValue<number | null>}
      />
    );
  };

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      openedRowIndex.value = -1;
      if (!isFlashListReady) {
        runOnJS(setFlashListReady)(true);
      }
    },
  });

  const shouldShowEmptyLoader = isNotificationsLoading && notifications.length === 0;
  const emptyMsg = FILTER_EMPTY_MESSAGES[selectedFilter];

  return shouldShowEmptyLoader ? (
    <Animated.View
      style={tailwind.style('flex-1 items-center justify-center', `pb-[${TAB_BAR_HEIGHT}px]`)}>
      <ActivityIndicator color={isDark ? '#38bdf8' : '#2563eb'} />
    </Animated.View>
  ) : notifications.length === 0 ? (
    <Animated.ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={tailwind.style(
        'flex-1',
        `pb-[${TAB_BAR_HEIGHT}px]`,
      )}>
      <FilterChips
        options={FILTER_OPTIONS}
        selectedId={selectedFilter}
        onSelect={handleFilterSelect}
      />
      <EmptyState
        icon={<InboxEmptyIcon size={64} color={isDark ? '#64748b' : '#9ca3af'} />}
        title={emptyMsg.title}
        subtitle={emptyMsg.subtitle}
      />
    </Animated.ScrollView>
  ) : (
    <AnimatedFlashlist
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      layout={LinearTransition.springify().damping(18).stiffness(120)}
      showsVerticalScrollIndicator={false}
      data={notifications}
      estimatedItemSize={71}
      onScroll={scrollHandler}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <FilterChips
          options={FILTER_OPTIONS}
          selectedId={selectedFilter}
          onSelect={handleFilterSelect}
        />
      }
      ListFooterComponent={ListFooterComponent}
      renderItem={handleRender}
      contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT - 1}px]`)}
    />
  );
};

const NotificationsScreen = () => {
  const { isDark } = useTheme();
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#030712';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        translucent
        backgroundColor={bgColor}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: textPrimary }}>
          Notifications
        </Text>
      </View>
      <InboxListStateProvider>
        <InboxList />
      </InboxListStateProvider>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
