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
import type { Notification } from '@/types/Notification';
import { tailwind } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notificationActions } from '@/store/notification/notificationAction';
import {
  selectIsAllNotificationsFetched,
  selectIsLoadingNotifications,
  getFilteredNotifications,
} from '@/store/notification/notificationSelectors';
import { InboxItemContainer } from '@/screens/inbox/components';
import { useInboxListStateContext } from '@/context';
import { resetNotifications } from '@/store/notification/notificationSlice';
import i18n from '@/i18n';
import { selectSortOrder } from '@/store/notification/notificationFilterSlice';
import { InboxSortTypes } from '@/store/notification/notificationTypes';
import { ArchiveBoxIcon } from '@/svg-icons';
import { FilterChips, EmptyState } from '@/components-next';

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<Notification>);

const FILTER_OPTIONS = [
  { id: 'new', label: 'New' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
];

const InboxList = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [isFlashListReady, setFlashListReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('archived');

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
        <ActivityIndicator size="small" />
      </Animated.View>
    );
  });

  useEffect(() => {
    clearAndFetchNotifications(sortOrder);
  }, []);

  const clearAndFetchNotifications = useCallback(async (sortOrder: InboxSortTypes) => {
    setPageNumber(1);
    await dispatch(resetNotifications());
    fetchNotifications(sortOrder);
  }, []);

  const fetchNotifications = useCallback(
    async (sortOrder: InboxSortTypes, page: number = 1) => {
      dispatch(notificationActions.fetchNotifications({ page, sort_order: sortOrder }));
    },
    [],
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

  return shouldShowEmptyLoader ? (
    <Animated.View
      style={tailwind.style('flex-1 items-center justify-center', `pb-[${TAB_BAR_HEIGHT}px]`)}>
      <ActivityIndicator />
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
        onSelect={setSelectedFilter}
      />
      <EmptyState
        icon={<ArchiveBoxIcon size={64} color="#9CA3AF" />}
        title="Empty Archive!"
        subtitle="There are no archived notifications"
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
          onSelect={setSelectedFilter}
        />
      }
      ListFooterComponent={ListFooterComponent}
      renderItem={handleRender}
      contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT - 1}px]`)}
    />
  );
};

const NotificationsScreen = () => {
  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('px-5 pt-4 pb-2')}>
        <Text style={tailwind.style('text-[28px] font-inter-580-24 text-gray-950')}>
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
